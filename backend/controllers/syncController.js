/**
 * Sync Controller
 * Handles offline-first transaction sync with idempotent processing
 * 
 * Integration point: Branch/Offline Queue → MongoDB → IPFS → Blockchain
 * 
 * Accepts an array of queued transactions from clients that were offline.
 * Each transaction must have a unique clientId to prevent duplicate processing.
 */

const { Order, Product, Invoice } = require('../models');
const invoiceService = require('../services/invoiceService');

// In-memory idempotency set (use Redis in production for multi-instance)
const processedClientIds = new Set();

/**
 * Sync offline transaction queue
 * POST /api/sync
 * 
 * Body: { transactions: [{ clientId, type, payload, timestamp }] }
 * 
 * Supported types:
 *   - 'inventory_update': { barcode, quantity, action }
 *   - 'order': { items, buyer, supplierDetails }
 *   - 'invoice': { orderId, customer, items }
 */
exports.syncOfflineQueue = async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transactions array is required and must not be empty'
      });
    }

    const results = [];

    for (const tx of transactions) {
      // Validate transaction structure
      if (!tx.clientId || !tx.type) {
        results.push({
          clientId: tx.clientId || 'unknown',
          status: 'failed',
          error: 'Missing clientId or type'
        });
        continue;
      }

      // Idempotency check — skip duplicates
      if (processedClientIds.has(tx.clientId)) {
        results.push({
          clientId: tx.clientId,
          status: 'duplicate',
          skipped: true
        });
        continue;
      }

      try {
        let result;

        switch (tx.type) {
          case 'inventory_update': {
            const { barcode, quantity, action } = tx.payload || {};
            const product = await Product.findByBarcode(barcode);
            if (!product) {
              throw new Error(`Product not found for barcode: ${barcode}`);
            }
            if (action === 'add') {
              await product.addStock(quantity || 1);
            } else {
              await product.deductStock(quantity || 1);
            }
            result = { productId: product._id, newQuantity: product.quantity };
            break;
          }

          case 'order': {
            const count = await Order.countDocuments();
            const orderId = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
            const order = new Order({
              orderId,
              ...tx.payload,
              status: 'pending',
              blockchainStatus: 'pending'
            });
            await order.save();
            result = { orderId: order.orderId };
            break;
          }

          case 'invoice': {
            const pdfResult = await invoiceService.generateInvoice(tx.payload);
            // Attempt IPFS upload
            let ipfsResult = null;
            try {
              ipfsResult = await invoiceService.uploadToIPFS(pdfResult.filePath, `${pdfResult.invoiceId}.pdf`);
            } catch (e) {
              // IPFS upload is optional
            }

            const invoice = new Invoice({
              invoiceId: pdfResult.invoiceId,
              ...tx.payload,
              pdfUrl: pdfResult.pdfUrl,
              pdfPath: pdfResult.filePath,
              ipfsCid: ipfsResult?.ipfsCid || null,
              ipfsGatewayUrl: ipfsResult?.ipfsGatewayUrl || null,
              ipfsUploadedAt: ipfsResult ? new Date() : null,
              status: 'sent'
            });
            await invoice.save();
            result = { invoiceId: invoice.invoiceId, ipfsCid: ipfsResult?.ipfsCid };
            break;
          }

          default:
            throw new Error(`Unknown transaction type: ${tx.type}`);
        }

        // Mark as processed (idempotent)
        processedClientIds.add(tx.clientId);

        results.push({
          clientId: tx.clientId,
          type: tx.type,
          status: 'synced',
          result
        });
      } catch (txError) {
        results.push({
          clientId: tx.clientId,
          type: tx.type,
          status: 'failed',
          error: txError.message
        });
      }
    }

    const synced = results.filter(r => r.status === 'synced').length;
    const duplicates = results.filter(r => r.status === 'duplicate').length;
    const failed = results.filter(r => r.status === 'failed').length;

    // Emit sync complete event via Socket.io
    req.app.get('io')?.emit('sync:complete', {
      total: results.length,
      synced,
      duplicates,
      failed
    });

    res.json({
      success: true,
      message: `Sync complete: ${synced} synced, ${duplicates} duplicates skipped, ${failed} failed`,
      data: {
        results,
        summary: { total: results.length, synced, duplicates, failed }
      }
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
