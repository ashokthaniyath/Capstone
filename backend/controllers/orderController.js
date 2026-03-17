/**
 * Order Controller
 * Handles order operations with blockchain integration
 */

const { Order, Product, Vendor } = require('../models');
const blockchainService = require('../services/blockchainService');
const aiService = require('../services/aiService');
const { ethers } = require('ethers');

/**
 * Create a new order with blockchain
 * POST /api/order/create
 */
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      buyer,
      supplierId,
      supplierDetails,
      shippingAddress,
      notes,
      useBlockchain = true
    } = req.body;
    
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Order items are required'
      });
    }
    
    // Generate order ID
    const count = await Order.countDocuments();
    const orderId = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    
    // Process items and calculate totals
    const processedItems = [];
    let subtotal = 0;
    
    for (const item of items) {
      let product = null;
      
      if (item.productId) {
        product = await Product.findById(item.productId);
      } else if (item.barcode) {
        product = await Product.findByBarcode(item.barcode);
      }
      
      const unitPrice = item.unitPrice || (product?.price) || 0;
      const quantity = item.quantity || 1;
      const totalPrice = unitPrice * quantity;
      
      processedItems.push({
        product: product?._id,
        productName: item.productName || product?.name || 'Unknown',
        sku: item.sku || product?.sku,
        quantity,
        unitPrice,
        totalPrice
      });
      
      subtotal += totalPrice;
    }
    
    // Calculate tax (18% GST)
    const taxRate = 18;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;
    
    // Get supplier info
    let vendor = null;
    if (supplierId) {
      vendor = await Vendor.findById(supplierId);
    }
    
    // Create order
    const order = new Order({
      orderId,
      type: 'purchase',
      buyer: buyer || {
        name: 'BlockERP User',
        address: process.env.DEFAULT_BUYER_ADDRESS || '0x0000000000000000000000000000000000000000'
      },
      supplier: vendor?._id,
      supplierDetails: supplierDetails || {
        name: vendor?.name,
        address: vendor?.walletAddress
      },
      items: processedItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      shippingAddress,
      notes,
      status: 'pending',
      blockchainStatus: useBlockchain ? 'pending' : 'not_applicable'
    });
    
    await order.save();
    order.addHistory('created', 'pending', 'system', 'Order created');
    
    // Blockchain integration
    let blockchainResult = null;
    
    if (useBlockchain) {
      try {
        if (!blockchainService.isInitialized) {
          console.log('⚠️ Blockchain not initialized - order created without blockchain');
          order.blockchainStatus = 'pending';
        } else {
          const buyerAddress = buyer?.address || process.env.DEFAULT_BUYER_ADDRESS;
          const supplierAddress = supplierDetails?.address || vendor?.walletAddress;
          
          if (buyerAddress && supplierAddress) {
            // Convert to wei (assuming total is in INR, use a mock ETH value for demo)
            const amountWei = ethers.parseEther((total / 100000).toFixed(18).toString()); // Mock conversion
            
            blockchainResult = await blockchainService.createOrder(
              orderId,
              buyerAddress,
              supplierAddress,
              amountWei.toString()
            );
            
            order.blockchainTxHash = blockchainResult.transactionHash;
            order.blockchainStatus = 'created';
            order.escrowAmount = amountWei.toString();
            
            await order.save();
            await order.addHistory('blockchain_created', 'created', 'system', 
              'Order created on blockchain', blockchainResult.transactionHash);
          }
        }
      } catch (bcError) {
        console.error('Blockchain error:', bcError.message);
        order.blockchainStatus = 'failed';
        await order.save();
        await order.addHistory('blockchain_failed', 'pending', 'system', bcError.message);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order,
        blockchain: blockchainResult
      }
    });
    
    // Emit real-time event via Socket.io
    req.app.get('io')?.emit('order:created', {
      orderId: order.orderId,
      status: order.status,
      total: order.total,
      blockchainStatus: order.blockchainStatus
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Confirm delivery (triggers blockchain confirmation)
 * POST /api/order/confirm-delivery
 */
exports.confirmDelivery = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }
    
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    if (order.status === 'delivered' || order.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Order already delivered'
      });
    }
    
    // Update order status
    order.status = 'delivered';
    order.actualDelivery = new Date();
    order.deliveryConfirmedAt = new Date();
    
    // Blockchain confirmation
    let blockchainResult = null;
    
    if (order.blockchainStatus === 'created' && blockchainService.isInitialized) {
      try {
        blockchainResult = await blockchainService.confirmDelivery(orderId);
        
        order.blockchainStatus = 'delivered';
        order.blockchainTxHash = blockchainResult.transactionHash;
        
        await order.addHistory('delivery_confirmed', 'delivered', 'system',
          'Delivery confirmed on blockchain', blockchainResult.transactionHash);
          
        // Update vendor trust metrics
        if (order.supplier) {
          const vendor = await Vendor.findById(order.supplier);
          if (vendor) {
            const daysToDeliver = Math.ceil(
              (new Date() - order.orderDate) / (1000 * 60 * 60 * 24)
            );
            await vendor.recordOrderCompletion(true, daysToDeliver, false, true);
          }
        }
      } catch (bcError) {
        console.error('Blockchain confirmation error:', bcError.message);
        await order.addHistory('blockchain_confirm_failed', 'delivered', 'system', bcError.message);
      }
    } else {
      await order.addHistory('delivery_confirmed', 'delivered', 'system', 'Delivery confirmed');
    }
    
    await order.save();
    
    // Emit real-time event via Socket.io
    req.app.get('io')?.emit('order:delivered', {
      orderId: order.orderId,
      blockchainTxHash: order.blockchainTxHash
    });
    
    res.json({
      success: true,
      message: 'Delivery confirmed successfully',
      data: {
        order,
        blockchain: blockchainResult
      }
    });
  } catch (error) {
    console.error('Confirm delivery error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Release payment (only after delivery confirmed)
 * POST /api/order/release-payment
 */
exports.releasePayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }
    
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Cannot release payment - delivery not confirmed. Current status: ' + order.status
      });
    }
    
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Payment already released'
      });
    }
    
    // Blockchain payment release
    let blockchainResult = null;
    
    if (order.blockchainStatus === 'delivered' && blockchainService.isInitialized) {
      try {
        blockchainResult = await blockchainService.releasePayment(orderId);
        
        order.blockchainStatus = 'paid';
        order.blockchainTxHash = blockchainResult.transactionHash;
        
        await order.addHistory('payment_released', 'paid', 'system',
          'Payment released on blockchain', blockchainResult.transactionHash);
      } catch (bcError) {
        console.error('Blockchain payment error:', bcError.message);
        return res.status(500).json({
          success: false,
          error: `Blockchain payment failed: ${bcError.message}`
        });
      }
    } else {
      await order.addHistory('payment_released', 'paid', 'system', 'Payment released');
    }
    
    // Update order status
    order.status = 'completed';
    order.paymentStatus = 'paid';
    order.paymentReleasedAt = new Date();
    
    await order.save();
    
    // Emit real-time event via Socket.io
    req.app.get('io')?.emit('order:paid', {
      orderId: order.orderId,
      blockchainTxHash: order.blockchainTxHash
    });
    
    res.json({
      success: true,
      message: 'Payment released successfully',
      data: {
        order,
        blockchain: blockchainResult
      }
    });
  } catch (error) {
    console.error('Release payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get order details with blockchain status
 * GET /api/order/:orderId
 */
exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ orderId })
      .populate('supplier')
      .populate('items.product');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Get blockchain data if available
    let blockchainData = null;
    if (order.blockchainTxHash && blockchainService.isInitialized) {
      try {
        blockchainData = await blockchainService.getOrder(orderId);
      } catch (e) {
        console.log('Could not fetch blockchain data:', e.message);
      }
    }
    
    // Get AI explanation
    const aiExplanation = aiService.explainTransaction(orderId, order.toObject());
    
    res.json({
      success: true,
      data: {
        order,
        blockchain: blockchainData,
        aiExplanation
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all orders
 * GET /api/orders
 */
exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    
    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('supplier');
    
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Cancel order
 * POST /api/order/cancel
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    if (order.status === 'delivered' || order.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel delivered or completed orders'
      });
    }
    
    order.status = 'cancelled';
    order.blockchainStatus = 'cancelled';
    
    await order.addHistory('cancelled', 'cancelled', 'user', reason || 'Order cancelled');
    await order.save();
    
    res.json({
      success: true,
      message: 'Order cancelled',
      data: { order }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
