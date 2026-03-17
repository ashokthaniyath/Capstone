/**
 * API Routes
 * All backend API endpoints
 */

const express = require('express');
const router = express.Router();

const {
  productController,
  orderController,
  invoiceController,
  vendorController
} = require('../controllers');

const auditController = require('../controllers/auditController');
const syncController = require('../controllers/syncController');

// ============================================
// Health Check
// ============================================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'BlockERP API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ============================================
// PRODUCT / INVENTORY ROUTES
// ============================================

// Create product with auto-generated barcode
router.post('/product/create', productController.createProduct);

// Get product by barcode (scanner)
router.get('/product/barcode/:code', productController.getProductByBarcode);

// Get all inventory
router.get('/inventory', productController.getInventory);

// Add stock to inventory
router.post('/inventory/add', productController.addStock);

// Update inventory (deduct on sale)
router.post('/inventory/update', productController.updateStock);

// Get low stock items with AI suggestions
router.get('/inventory/low-stock', productController.getLowStockItems);

// Scan barcode and auto-deduct (POS)
router.post('/inventory/scan', productController.scanBarcode);

// POST /api/sale/scan — alias for POS barcode scan (spec compliance)
router.post('/sale/scan', productController.scanBarcode);

// Get product barcode image
router.get('/product/:id/barcode', productController.getProductBarcode);

// Get product label (barcode + QR)
router.get('/product/:id/label', productController.getProductLabel);

// ============================================
// ORDER ROUTES (Blockchain Integrated)
// ============================================

// Create order (triggers blockchain)
router.post('/order/create', orderController.createOrder);

// Confirm delivery (blockchain update)
router.post('/order/confirm-delivery', orderController.confirmDelivery);

// Release payment (only after delivery)
router.post('/order/release-payment', orderController.releasePayment);

// Cancel order
router.post('/order/cancel', orderController.cancelOrder);

// Get order by ID
router.get('/order/:orderId', orderController.getOrder);

// Get all orders
router.get('/orders', orderController.getOrders);

// ============================================
// INVOICE ROUTES
// ============================================

// Generate invoice (PDF)
router.post('/invoice/generate', invoiceController.generateInvoice);

// Download invoice PDF
router.get('/invoice/download/:invoiceId', invoiceController.downloadInvoice);

// Get invoice by ID
router.get('/invoice/:invoiceId', invoiceController.getInvoice);

// Get all invoices
router.get('/invoices', invoiceController.getInvoices);

// Mark invoice as paid
router.post('/invoice/:invoiceId/pay', invoiceController.markAsPaid);

// Regenerate invoice PDF
router.post('/invoice/:invoiceId/regenerate', invoiceController.regenerateInvoice);

// ============================================
// VENDOR ROUTES (Trust Score)
// ============================================

// Get vendor trust score
router.get('/vendor/trust-score/:id', vendorController.getTrustScore);

// Create vendor
router.post('/vendor/create', vendorController.createVendor);

// Get vendor leaderboard
router.get('/vendors/leaderboard', vendorController.getLeaderboard);

// Get all vendors
router.get('/vendors', vendorController.getVendors);

// Get vendor by ID
router.get('/vendor/:id', vendorController.getVendor);

// Update vendor
router.put('/vendor/:id', vendorController.updateVendor);

// Record order completion (for trust score)
router.post('/vendor/:id/record-order', vendorController.recordOrderCompletion);

// ============================================
// AI ASSISTANT ROUTES
// ============================================

const aiService = require('../services/aiService');

// Get reorder suggestions
router.post('/ai/suggest-reorder', async (req, res) => {
  try {
    const { Product } = require('../models');
    const products = await Product.find({ status: 'active' });
    const suggestions = aiService.suggestReorder(products);
    
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Explain transaction
router.get('/ai/explain-transaction/:orderId', async (req, res) => {
  try {
    const { Order } = require('../models');
    const order = await Order.findOne({ orderId: req.params.orderId });
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    const explanation = aiService.explainTransaction(req.params.orderId, order.toObject());
    
    res.json({
      success: true,
      data: explanation
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI service status
router.get('/ai/status', (req, res) => {
  res.json({
    success: true,
    data: aiService.getStatus()
  });
});

// ============================================
// AUDIT VERIFICATION ROUTES
// ============================================

// Verify audit record (returns MongoDB + IPFS + blockchain data)
router.get('/audit/verify/:id', auditController.verifyRecord);

// ============================================
// OFFLINE SYNC ROUTES
// ============================================

// Sync offline transaction queue (idempotent)
router.post('/sync', syncController.syncOfflineQueue);

// ============================================
// BLOCKCHAIN ROUTES
// ============================================

const blockchainService = require('../services/blockchainService');

// Get blockchain status
router.get('/blockchain/status', async (req, res) => {
  try {
    const isInitialized = blockchainService.isInitialized;
    const walletAddress = blockchainService.getWalletAddress();
    const contractAddress = blockchainService.getContractAddress();
    
    let stats = null;
    if (isInitialized && contractAddress) {
      try {
        stats = await blockchainService.getContractStats();
      } catch (e) {
        console.log('Could not get contract stats');
      }
    }
    
    res.json({
      success: true,
      data: {
        initialized: isInitialized,
        walletAddress,
        contractAddress,
        stats,
        network: 'Polygon Mumbai Testnet'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get blockchain order
router.get('/blockchain/order/:orderId', async (req, res) => {
  try {
    if (!blockchainService.isInitialized) {
      return res.status(503).json({
        success: false,
        error: 'Blockchain service not initialized'
      });
    }
    
    const order = await blockchainService.getOrder(req.params.orderId);
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deploy contract (admin only)
router.post('/blockchain/deploy', async (req, res) => {
  try {
    if (!blockchainService.isInitialized) {
      return res.status(503).json({
        success: false,
        error: 'Blockchain service not initialized. Set PRIVATE_KEY and initialize first.'
      });
    }
    
    const result = await blockchainService.deployContract();
    
    res.json({
      success: true,
      message: 'Contract deployed successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
