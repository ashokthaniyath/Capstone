/**
 * Audit Controller
 * Handles audit verification — returns MongoDB record + IPFS CID + blockchain tx hash
 */

const { Order, Invoice } = require('../models');

/**
 * Verify a record by entity ID (order or invoice)
 * GET /api/audit/verify/:id
 * 
 * Looks up the ID across Orders and Invoices,
 * returns the combined verification data including:
 * - MongoDB record
 * - IPFS CID (if invoice was uploaded to Pinata)
 * - Blockchain transaction hash (if anchored on-chain)
 */
exports.verifyRecord = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Entity ID is required'
      });
    }

    let record = null;
    let entityType = null;
    let ipfsCid = null;
    let ipfsGatewayUrl = null;
    let blockchainTxHash = null;

    // Try to find as Order first
    const order = await Order.findOne({ orderId: id });
    if (order) {
      entityType = 'order';
      record = order.toObject();
      blockchainTxHash = order.blockchainTxHash || null;
    }

    // Try to find as Invoice
    if (!record) {
      const invoice = await Invoice.findOne({ invoiceId: id });
      if (invoice) {
        entityType = 'invoice';
        record = invoice.toObject();
        blockchainTxHash = invoice.blockchainTxHash || null;
        ipfsCid = invoice.ipfsCid || null;
        ipfsGatewayUrl = invoice.ipfsGatewayUrl || null;
      }
    }

    // Also check if the order has an associated invoice with IPFS data
    if (entityType === 'order' && order.invoice) {
      const relatedInvoice = await Invoice.findById(order.invoice);
      if (relatedInvoice) {
        ipfsCid = relatedInvoice.ipfsCid || null;
        ipfsGatewayUrl = relatedInvoice.ipfsGatewayUrl || null;
      }
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Record not found. Provide a valid Order ID or Invoice ID.'
      });
    }

    res.json({
      success: true,
      data: {
        entityType,
        entityId: id,
        record,
        verification: {
          mongodbStored: true,
          ipfsCid: ipfsCid,
          ipfsGatewayUrl: ipfsGatewayUrl,
          ipfsStored: !!ipfsCid,
          blockchainTxHash: blockchainTxHash,
          blockchainAnchored: !!blockchainTxHash
        },
        verifiedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Audit verify error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
