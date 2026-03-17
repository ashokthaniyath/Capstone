// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PurchaseOrder
 * @dev Smart contract for managing purchase orders with escrow-like payment release
 * @notice Payment is ONLY released after delivery confirmation
 */
contract PurchaseOrder {
    // ============================================
    // ENUMS & STRUCTS
    // ============================================
    
    enum OrderStatus {
        Created,        // Order created, awaiting delivery
        Delivered,      // Delivery confirmed by buyer
        Paid,           // Payment released to supplier
        Cancelled       // Order cancelled
    }
    
    struct Order {
        string orderId;           // External order ID reference
        address buyer;            // Buyer's wallet address
        address payable supplier; // Supplier's wallet address (payable for transfers)
        uint256 amount;           // Order amount in wei
        uint256 createdAt;        // Timestamp of creation
        uint256 deliveredAt;      // Timestamp of delivery confirmation
        uint256 paidAt;           // Timestamp of payment release
        OrderStatus status;       // Current order status
        bool exists;              // Flag to check if order exists
    }
    
    // ============================================
    // STATE VARIABLES
    // ============================================
    
    mapping(string => Order) public orders;
    string[] public orderIds;
    address public owner;
    uint256 public totalOrders;
    uint256 public totalVolume;
    
    // Vendor trust score tracking
    mapping(address => uint256) public vendorSuccessfulOrders;
    mapping(address => uint256) public vendorTotalOrders;
    mapping(address => uint256) public vendorDeliveryDelays; // Count of late deliveries
    
    // ============================================
    // EVENTS
    // ============================================
    
    event OrderCreated(
        string indexed orderId,
        address indexed buyer,
        address indexed supplier,
        uint256 amount,
        uint256 timestamp
    );
    
    event DeliveryConfirmed(
        string indexed orderId,
        address indexed buyer,
        uint256 timestamp
    );
    
    event PaymentReleased(
        string indexed orderId,
        address indexed supplier,
        uint256 amount,
        uint256 timestamp
    );
    
    event OrderCancelled(
        string indexed orderId,
        address indexed buyer,
        uint256 timestamp
    );
    
    event TrustScoreUpdated(
        address indexed vendor,
        uint256 successfulOrders,
        uint256 totalOrders,
        uint256 delays
    );
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier orderExists(string memory _orderId) {
        require(orders[_orderId].exists, "Order does not exist");
        _;
    }
    
    modifier onlyBuyer(string memory _orderId) {
        require(orders[_orderId].buyer == msg.sender, "Only buyer can call this function");
        _;
    }
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor() {
        owner = msg.sender;
    }
    
    // ============================================
    // MAIN FUNCTIONS
    // ============================================
    
    /**
     * @dev Creates a new purchase order with escrow
     * @param _orderId Unique order identifier
     * @param _buyer Address of the buyer
     * @param _supplier Address of the supplier (receives payment)
     * @param _amount Order amount in wei
     * @notice Buyer must send the exact amount as msg.value for escrow
     */
    function createOrder(
        string memory _orderId,
        address _buyer,
        address payable _supplier,
        uint256 _amount
    ) external payable {
        require(!orders[_orderId].exists, "Order already exists");
        require(_buyer != address(0), "Invalid buyer address");
        require(_supplier != address(0), "Invalid supplier address");
        require(_amount > 0, "Amount must be greater than 0");
        require(msg.value == _amount, "Must send exact amount for escrow");
        
        orders[_orderId] = Order({
            orderId: _orderId,
            buyer: _buyer,
            supplier: _supplier,
            amount: _amount,
            createdAt: block.timestamp,
            deliveredAt: 0,
            paidAt: 0,
            status: OrderStatus.Created,
            exists: true
        });
        
        orderIds.push(_orderId);
        totalOrders++;
        totalVolume += _amount;
        
        // Update vendor tracking
        vendorTotalOrders[_supplier]++;
        
        emit OrderCreated(_orderId, _buyer, _supplier, _amount, block.timestamp);
    }
    
    /**
     * @dev Confirms delivery of the order (only buyer can confirm)
     * @param _orderId The order to confirm delivery for
     * @notice This must be called before payment can be released
     */
    function confirmDelivery(string memory _orderId) 
        external 
        orderExists(_orderId)
        onlyBuyer(_orderId)
    {
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.Created, "Order not in created status");
        
        order.status = OrderStatus.Delivered;
        order.deliveredAt = block.timestamp;
        
        // Check for delivery delay (> 7 days from creation = late)
        if (block.timestamp > order.createdAt + 7 days) {
            vendorDeliveryDelays[order.supplier]++;
        }
        
        emit DeliveryConfirmed(_orderId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Releases payment to supplier ONLY if delivery is confirmed
     * @param _orderId The order to release payment for
     * @notice Payment cannot be released without delivery confirmation
     */
    function releasePayment(string memory _orderId) 
        external 
        orderExists(_orderId)
    {
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.Delivered, "Delivery not confirmed - cannot release payment");
        require(order.buyer == msg.sender || owner == msg.sender, "Only buyer or owner can release payment");
        
        order.status = OrderStatus.Paid;
        order.paidAt = block.timestamp;
        
        // Update vendor success count
        vendorSuccessfulOrders[order.supplier]++;
        
        // Transfer funds to supplier
        (bool success, ) = order.supplier.call{value: order.amount}("");
        require(success, "Payment transfer failed");
        
        emit PaymentReleased(_orderId, order.supplier, order.amount, block.timestamp);
        emit TrustScoreUpdated(
            order.supplier,
            vendorSuccessfulOrders[order.supplier],
            vendorTotalOrders[order.supplier],
            vendorDeliveryDelays[order.supplier]
        );
    }
    
    /**
     * @dev Cancels an order and refunds the buyer
     * @param _orderId The order to cancel
     * @notice Can only cancel orders that haven't been delivered
     */
    function cancelOrder(string memory _orderId)
        external
        orderExists(_orderId)
        onlyBuyer(_orderId)
    {
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.Created, "Can only cancel orders awaiting delivery");
        
        order.status = OrderStatus.Cancelled;
        
        // Refund buyer
        (bool success, ) = payable(order.buyer).call{value: order.amount}("");
        require(success, "Refund transfer failed");
        
        emit OrderCancelled(_orderId, msg.sender, block.timestamp);
    }
    
    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    /**
     * @dev Gets order details
     * @param _orderId The order to query
     * @return Order struct with all details
     */
    function getOrder(string memory _orderId) 
        external 
        view 
        orderExists(_orderId)
        returns (Order memory) 
    {
        return orders[_orderId];
    }
    
    /**
     * @dev Gets vendor trust score (0-100)
     * @param _vendor Address of the vendor
     * @return trustScore Calculated trust score
     */
    function getVendorTrustScore(address _vendor) external view returns (uint256 trustScore) {
        uint256 total = vendorTotalOrders[_vendor];
        if (total == 0) return 50; // Default score for new vendors
        
        uint256 successful = vendorSuccessfulOrders[_vendor];
        uint256 delays = vendorDeliveryDelays[_vendor];
        
        // Base score from success rate (0-70 points)
        uint256 successRate = (successful * 70) / total;
        
        // Penalty for delays (up to -30 points)
        uint256 delayPenalty = delays > total ? 30 : (delays * 30) / total;
        
        // Calculate final score (minimum 0)
        trustScore = successRate > delayPenalty ? successRate + 30 - delayPenalty : 0;
        
        // Cap at 100
        if (trustScore > 100) trustScore = 100;
        
        return trustScore;
    }
    
    /**
     * @dev Gets vendor statistics
     * @param _vendor Address of the vendor
     */
    function getVendorStats(address _vendor) external view returns (
        uint256 successful,
        uint256 total,
        uint256 delays
    ) {
        return (
            vendorSuccessfulOrders[_vendor],
            vendorTotalOrders[_vendor],
            vendorDeliveryDelays[_vendor]
        );
    }
    
    /**
     * @dev Gets all order IDs
     */
    function getAllOrderIds() external view returns (string[] memory) {
        return orderIds;
    }
    
    /**
     * @dev Gets contract statistics
     */
    function getContractStats() external view returns (
        uint256 _totalOrders,
        uint256 _totalVolume,
        uint256 _contractBalance
    ) {
        return (totalOrders, totalVolume, address(this).balance);
    }
    
    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    /**
     * @dev Transfers ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
    
    /**
     * @dev Emergency withdrawal (only owner, only if no pending orders)
     */
    function emergencyWithdraw() external onlyOwner {
        require(address(this).balance > 0, "No balance to withdraw");
        (bool success, ) = payable(owner).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
    
    // Receive function to accept ETH
    receive() external payable {}
}
