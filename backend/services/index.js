/**
 * Services Index
 * Export all backend services
 */

const blockchainService = require('./blockchainService');
const aiService = require('./aiService');
const barcodeService = require('./barcodeService');
const invoiceService = require('./invoiceService');

module.exports = {
  blockchainService,
  aiService,
  barcodeService,
  invoiceService
};
