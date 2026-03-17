/**
 * Invoice Controller
 * Handles invoice generation and management
 */

const { Invoice, Order, Product } = require('../models');
const invoiceService = require('../services/invoiceService');
const barcodeService = require('../services/barcodeService');
const path = require('path');
const fs = require('fs');

/**
 * Generate invoice after sale
 * POST /api/invoice/generate
 */
exports.generateInvoice = async (req, res) => {
  try {
    const { orderId, customer, items, customData } = req.body;
    
    let invoiceData = { ...customData };
    
    // If orderId provided, get data from order
    if (orderId) {
      const order = await Order.findOne({ orderId }).populate('items.product');
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
      
      // Map order items to invoice items
      invoiceData = {
        orderId: order.orderId,
        customer: customer || order.buyer || {
          name: 'Customer',
          email: 'customer@example.com'
        },
        items: order.items.map(item => ({
          description: item.productName || 'Product',
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: order.taxRate || 18
        })),
        subtotal: order.subtotal,
        totalTax: order.taxAmount,
        discount: order.discount || 0,
        total: order.total,
        blockchainTxHash: order.blockchainTxHash,
        ...customData
      };
    }
    
    // Validate required data
    if (!invoiceData.items || invoiceData.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invoice items are required'
      });
    }
    
    if (!invoiceData.customer) {
      invoiceData.customer = {
        name: 'Customer',
        email: 'customer@example.com'
      };
    }
    
    // Calculate totals if not provided
    if (!invoiceData.subtotal) {
      invoiceData.subtotal = invoiceData.items.reduce(
        (sum, item) => sum + (item.unitPrice * item.quantity), 0
      );
    }
    
    if (!invoiceData.totalTax) {
      invoiceData.totalTax = invoiceData.items.reduce(
        (sum, item) => sum + ((item.unitPrice * item.quantity * (item.taxRate || 18)) / 100), 0
      );
    }
    
    if (!invoiceData.total) {
      invoiceData.total = invoiceData.subtotal + invoiceData.totalTax - (invoiceData.discount || 0);
    }
    
    // Generate PDF
    const pdfResult = await invoiceService.generateInvoice(invoiceData);
    
    // Upload to IPFS (Pinata) — graceful fallback if not configured
    let ipfsResult = null;
    try {
      ipfsResult = await invoiceService.uploadToIPFS(pdfResult.filePath, `${pdfResult.invoiceId}.pdf`);
    } catch (ipfsError) {
      console.log('IPFS upload skipped:', ipfsError.message);
    }
    
    // Save invoice to database
    const invoice = new Invoice({
      invoiceId: pdfResult.invoiceId,
      orderId: invoiceData.orderId,
      customer: invoiceData.customer,
      items: invoiceData.items.map(item => ({
        description: item.description,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 18,
        taxAmount: (item.unitPrice * item.quantity * (item.taxRate || 18)) / 100,
        total: item.unitPrice * item.quantity * (1 + (item.taxRate || 18) / 100)
      })),
      subtotal: invoiceData.subtotal,
      totalTax: invoiceData.totalTax,
      discount: invoiceData.discount || 0,
      total: invoiceData.total,
      pdfUrl: pdfResult.pdfUrl,
      pdfPath: pdfResult.filePath,
      ipfsCid: ipfsResult?.ipfsCid || null,
      ipfsGatewayUrl: ipfsResult?.ipfsGatewayUrl || null,
      ipfsUploadedAt: ipfsResult ? new Date() : null,
      blockchainTxHash: invoiceData.blockchainTxHash,
      status: 'sent'
    });
    
    await invoice.save();
    
    // Emit real-time event via Socket.io
    req.app.get('io')?.emit('invoice:generated', {
      invoiceId: invoice.invoiceId,
      total: invoice.total,
      ipfsCid: invoice.ipfsCid
    });
    
    // Update order with invoice reference
    if (orderId) {
      await Order.findOneAndUpdate(
        { orderId },
        { invoice: invoice._id }
      );
    }
    
    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: {
        invoice,
        pdfUrl: pdfResult.pdfUrl,
        downloadUrl: `/api/invoice/download/${pdfResult.invoiceId}`,
        ipfs: ipfsResult ? {
          cid: ipfsResult.ipfsCid,
          gatewayUrl: ipfsResult.ipfsGatewayUrl
        } : null
      }
    });
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Download invoice PDF
 * GET /api/invoice/download/:invoiceId
 */
exports.downloadInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const invoice = await Invoice.findOne({ invoiceId });
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }
    
    const filePath = invoice.pdfPath || invoiceService.getInvoicePath(invoiceId);
    
    if (!fs.existsSync(filePath)) {
      // Regenerate PDF if not found
      const pdfResult = await invoiceService.generateInvoice(invoice.toObject());
      invoice.pdfPath = pdfResult.filePath;
      invoice.pdfUrl = pdfResult.pdfUrl;
      await invoice.save();
    }
    
    // Mark as viewed
    if (!invoice.viewedAt) {
      invoice.viewedAt = new Date();
      invoice.status = 'viewed';
      await invoice.save();
    }
    
    res.download(invoice.pdfPath || filePath, `${invoiceId}.pdf`);
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get invoice by ID
 * GET /api/invoice/:invoiceId
 */
exports.getInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const invoice = await Invoice.findOne({ invoiceId });
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }
    
    // Generate QR code for verification
    let qrCode = null;
    try {
      qrCode = await barcodeService.generateQRCode({
        invoiceId: invoice.invoiceId,
        total: invoice.total,
        date: invoice.invoiceDate
      });
    } catch (e) {
      console.log('QR generation skipped');
    }
    
    res.json({
      success: true,
      data: {
        invoice,
        qrCode,
        downloadUrl: `/api/invoice/download/${invoiceId}`
      }
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all invoices
 * GET /api/invoices
 */
exports.getInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    const invoices = await Invoice.find(query)
      .sort({ invoiceDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Invoice.countDocuments(query);
    
    // Calculate summary stats
    const stats = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$total' },
          paidAmount: { 
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] }
          },
          pendingAmount: { 
            $sum: { $cond: [{ $ne: ['$paymentStatus', 'paid'] }, '$total', 0] }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        stats: stats[0] || { totalAmount: 0, paidAmount: 0, pendingAmount: 0 }
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Mark invoice as paid
 * POST /api/invoice/:invoiceId/pay
 */
exports.markAsPaid = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { paymentMethod, transactionId } = req.body;
    
    const invoice = await Invoice.findOne({ invoiceId });
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }
    
    invoice.paymentStatus = 'paid';
    invoice.amountPaid = invoice.total;
    invoice.balanceDue = 0;
    invoice.paidAt = new Date();
    invoice.paymentMethod = paymentMethod || 'bank_transfer';
    
    if (transactionId) {
      invoice.blockchainTxHash = transactionId;
    }
    
    await invoice.save();
    
    res.json({
      success: true,
      message: 'Invoice marked as paid',
      data: { invoice }
    });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Regenerate invoice PDF
 * POST /api/invoice/:invoiceId/regenerate
 */
exports.regenerateInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const invoice = await Invoice.findOne({ invoiceId });
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }
    
    // Delete old PDF if exists
    if (invoice.pdfPath && fs.existsSync(invoice.pdfPath)) {
      fs.unlinkSync(invoice.pdfPath);
    }
    
    // Generate new PDF
    const pdfResult = await invoiceService.generateInvoice(invoice.toObject());
    
    invoice.pdfPath = pdfResult.filePath;
    invoice.pdfUrl = pdfResult.pdfUrl;
    await invoice.save();
    
    res.json({
      success: true,
      message: 'Invoice regenerated',
      data: {
        invoice,
        pdfUrl: pdfResult.pdfUrl,
        downloadUrl: `/api/invoice/download/${invoiceId}`
      }
    });
  } catch (error) {
    console.error('Regenerate invoice error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
