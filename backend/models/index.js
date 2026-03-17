/**
 * Models Index
 * Export all MongoDB models
 */

const Product = require('./Product');
const Order = require('./Order');
const Invoice = require('./Invoice');
const Vendor = require('./Vendor');

module.exports = {
  Product,
  Order,
  Invoice,
  Vendor
};
