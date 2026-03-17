/**
 * Controllers Index
 * Export all controllers
 */

const productController = require('./productController');
const orderController = require('./orderController');
const invoiceController = require('./invoiceController');
const vendorController = require('./vendorController');

module.exports = {
  productController,
  orderController,
  invoiceController,
  vendorController
};
