/**
 * Blockchain Service
 * Handles all blockchain interactions using ethers.js
 * Connects to Polygon Mumbai testnet
 */

const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.contractAddress = null;
    this.isInitialized = false;
  }

  /**
   * Initialize blockchain connection
   * @param {string} privateKey - Wallet private key
   * @param {string} contractAddress - Deployed contract address (optional)
   */
  async initialize(privateKey, contractAddress = null) {
    try {
      // Connect to Polygon Mumbai testnet
      // RPC URL for Mumbai testnet
      const rpcUrl = process.env.POLYGON_MUMBAI_RPC || 'https://rpc-mumbai.maticvigil.com';
      
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Create wallet from private key
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      
      console.log(`🔗 Connected to blockchain with address: ${this.wallet.address}`);
      
      // Get balance
      const balance = await this.provider.getBalance(this.wallet.address);
      console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} MATIC`);
      
      // Load contract if address provided
      if (contractAddress) {
        await this.loadContract(contractAddress);
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Blockchain initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Load the PurchaseOrder contract ABI
   */
  getContractABI() {
    try {
      // Try to load from artifacts
      const artifactPath = path.join(__dirname, '../../artifacts/contracts/PurchaseOrder.sol/PurchaseOrder.json');
      
      if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        return artifact.abi;
      }
      
      // Fallback: minimal ABI for PurchaseOrder contract
      return [
        "function createOrder(string memory _orderId, address _buyer, address payable _supplier, uint256 _amount) external payable",
        "function confirmDelivery(string memory _orderId) external",
        "function releasePayment(string memory _orderId) external",
        "function cancelOrder(string memory _orderId) external",
        "function getOrder(string memory _orderId) external view returns (tuple(string orderId, address buyer, address supplier, uint256 amount, uint256 createdAt, uint256 deliveredAt, uint256 paidAt, uint8 status, bool exists))",
        "function getVendorTrustScore(address _vendor) external view returns (uint256)",
        "function getVendorStats(address _vendor) external view returns (uint256 successful, uint256 total, uint256 delays)",
        "function getContractStats() external view returns (uint256 totalOrders, uint256 totalVolume, uint256 contractBalance)",
        "event OrderCreated(string indexed orderId, address indexed buyer, address indexed supplier, uint256 amount, uint256 timestamp)",
        "event DeliveryConfirmed(string indexed orderId, address indexed buyer, uint256 timestamp)",
        "event PaymentReleased(string indexed orderId, address indexed supplier, uint256 amount, uint256 timestamp)",
        "event OrderCancelled(string indexed orderId, address indexed buyer, uint256 timestamp)"
      ];
    } catch (error) {
      console.error('Error loading contract ABI:', error);
      throw error;
    }
  }

  /**
   * Load existing contract
   */
  async loadContract(contractAddress) {
    const abi = this.getContractABI();
    this.contract = new ethers.Contract(contractAddress, abi, this.wallet);
    this.contractAddress = contractAddress;
    console.log(`📜 Contract loaded at: ${contractAddress}`);
    return this.contract;
  }

  /**
   * Deploy new PurchaseOrder contract
   */
  async deployContract() {
    try {
      const artifactPath = path.join(__dirname, '../../artifacts/contracts/PurchaseOrder.sol/PurchaseOrder.json');
      
      if (!fs.existsSync(artifactPath)) {
        throw new Error('Contract artifact not found. Run: npx hardhat compile');
      }
      
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      
      console.log('🚀 Deploying PurchaseOrder contract...');
      
      const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, this.wallet);
      const contract = await factory.deploy();
      
      await contract.waitForDeployment();
      
      this.contract = contract;
      this.contractAddress = await contract.getAddress();
      
      console.log(`✅ Contract deployed at: ${this.contractAddress}`);
      
      return {
        address: this.contractAddress,
        transactionHash: contract.deploymentTransaction()?.hash
      };
    } catch (error) {
      console.error('❌ Contract deployment failed:', error.message);
      throw error;
    }
  }

  /**
   * Create a new purchase order on blockchain
   * @param {string} orderId - Unique order ID
   * @param {string} buyerAddress - Buyer's wallet address
   * @param {string} supplierAddress - Supplier's wallet address
   * @param {string} amount - Order amount in wei
   */
  async createOrder(orderId, buyerAddress, supplierAddress, amount) {
    this.ensureInitialized();
    
    try {
      console.log(`📝 Creating blockchain order: ${orderId}`);
      
      const tx = await this.contract.createOrder(
        orderId,
        buyerAddress,
        supplierAddress,
        amount,
        { value: amount } // Send ETH/MATIC for escrow
      );
      
      console.log(`⏳ Transaction submitted: ${tx.hash}`);
      
      const receipt = await tx.wait();
      
      console.log(`✅ Order created on blockchain. Block: ${receipt.blockNumber}`);
      
      // Parse OrderCreated event
      const event = receipt.logs.find(log => {
        try {
          return this.contract.interface.parseLog(log)?.name === 'OrderCreated';
        } catch { return false; }
      });
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        event: event ? this.contract.interface.parseLog(event) : null
      };
    } catch (error) {
      console.error('❌ Create order failed:', error.message);
      throw error;
    }
  }

  /**
   * Confirm delivery of an order
   * @param {string} orderId - Order ID to confirm
   */
  async confirmDelivery(orderId) {
    this.ensureInitialized();
    
    try {
      console.log(`📦 Confirming delivery for: ${orderId}`);
      
      const tx = await this.contract.confirmDelivery(orderId);
      console.log(`⏳ Transaction submitted: ${tx.hash}`);
      
      const receipt = await tx.wait();
      
      console.log(`✅ Delivery confirmed on blockchain. Block: ${receipt.blockNumber}`);
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('❌ Confirm delivery failed:', error.message);
      throw error;
    }
  }

  /**
   * Release payment for an order (only after delivery confirmed)
   * @param {string} orderId - Order ID to release payment for
   */
  async releasePayment(orderId) {
    this.ensureInitialized();
    
    try {
      console.log(`💸 Releasing payment for: ${orderId}`);
      
      const tx = await this.contract.releasePayment(orderId);
      console.log(`⏳ Transaction submitted: ${tx.hash}`);
      
      const receipt = await tx.wait();
      
      console.log(`✅ Payment released on blockchain. Block: ${receipt.blockNumber}`);
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('❌ Release payment failed:', error.message);
      throw error;
    }
  }

  /**
   * Get order details from blockchain
   * @param {string} orderId - Order ID to query
   */
  async getOrder(orderId) {
    this.ensureInitialized();
    
    try {
      const order = await this.contract.getOrder(orderId);
      
      const statusMap = ['Created', 'Delivered', 'Paid', 'Cancelled'];
      
      return {
        orderId: order.orderId,
        buyer: order.buyer,
        supplier: order.supplier,
        amount: order.amount.toString(),
        amountFormatted: ethers.formatEther(order.amount),
        createdAt: new Date(Number(order.createdAt) * 1000),
        deliveredAt: order.deliveredAt > 0 ? new Date(Number(order.deliveredAt) * 1000) : null,
        paidAt: order.paidAt > 0 ? new Date(Number(order.paidAt) * 1000) : null,
        status: statusMap[order.status] || 'Unknown',
        statusCode: order.status
      };
    } catch (error) {
      console.error('❌ Get order failed:', error.message);
      throw error;
    }
  }

  /**
   * Get vendor trust score from blockchain
   * @param {string} vendorAddress - Vendor's wallet address
   */
  async getVendorTrustScore(vendorAddress) {
    this.ensureInitialized();
    
    try {
      const score = await this.contract.getVendorTrustScore(vendorAddress);
      const stats = await this.contract.getVendorStats(vendorAddress);
      
      return {
        trustScore: Number(score),
        stats: {
          successfulOrders: Number(stats.successful),
          totalOrders: Number(stats.total),
          deliveryDelays: Number(stats.delays)
        }
      };
    } catch (error) {
      console.error('❌ Get trust score failed:', error.message);
      throw error;
    }
  }

  /**
   * Get contract statistics
   */
  async getContractStats() {
    this.ensureInitialized();
    
    try {
      const stats = await this.contract.getContractStats();
      
      return {
        totalOrders: Number(stats._totalOrders),
        totalVolume: ethers.formatEther(stats._totalVolume),
        contractBalance: ethers.formatEther(stats._contractBalance)
      };
    } catch (error) {
      console.error('❌ Get contract stats failed:', error.message);
      throw error;
    }
  }

  /**
   * Listen for contract events
   */
  setupEventListeners(callbacks = {}) {
    this.ensureInitialized();
    
    if (callbacks.onOrderCreated) {
      this.contract.on('OrderCreated', (orderId, buyer, supplier, amount, timestamp, event) => {
        callbacks.onOrderCreated({
          orderId, buyer, supplier,
          amount: ethers.formatEther(amount),
          timestamp: new Date(Number(timestamp) * 1000),
          transactionHash: event.transactionHash
        });
      });
    }
    
    if (callbacks.onDeliveryConfirmed) {
      this.contract.on('DeliveryConfirmed', (orderId, buyer, timestamp, event) => {
        callbacks.onDeliveryConfirmed({
          orderId, buyer,
          timestamp: new Date(Number(timestamp) * 1000),
          transactionHash: event.transactionHash
        });
      });
    }
    
    if (callbacks.onPaymentReleased) {
      this.contract.on('PaymentReleased', (orderId, supplier, amount, timestamp, event) => {
        callbacks.onPaymentReleased({
          orderId, supplier,
          amount: ethers.formatEther(amount),
          timestamp: new Date(Number(timestamp) * 1000),
          transactionHash: event.transactionHash
        });
      });
    }
    
    console.log('👂 Event listeners set up');
  }

  /**
   * Ensure service is initialized
   */
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('BlockchainService not initialized. Call initialize() first.');
    }
    if (!this.contract) {
      throw new Error('Contract not loaded. Deploy or load a contract first.');
    }
  }

  /**
   * Get wallet address
   */
  getWalletAddress() {
    return this.wallet?.address;
  }

  /**
   * Get contract address
   */
  getContractAddress() {
    return this.contractAddress;
  }
}

// Export singleton instance
module.exports = new BlockchainService();
