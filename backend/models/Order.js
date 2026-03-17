/**
 * Order Model - MongoDB Schema
 * Blockchain-integrated purchase order tracking
 */
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: String,
  sku: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  totalPrice: Number
}, { _id: false });

const orderSchema = new mongoose.Schema({
  // Order ID (human-readable)
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Order type
  type: {
    type: String,
    enum: ['purchase', 'sales'],
    default: 'purchase'
  },
  
  // Buyer information
  buyer: {
    address: String, // Blockchain wallet address
    name: String,
    email: String,
    company: String
  },
  
  // Supplier/Vendor information
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  
  supplierDetails: {
    address: String, // Blockchain wallet address
    name: String,
    email: String,
    company: String
  },
  
  // Order items
  items: [orderItemSchema],
  
  // Financial details
  subtotal: {
    type: Number,
    required: true
  },
  
  taxAmount: {
    type: Number,
    default: 0
  },
  
  taxRate: {
    type: Number,
    default: 18 // GST %
  },
  
  discount: {
    type: Number,
    default: 0
  },
  
  total: {
    type: Number,
    required: true
  },
  
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Blockchain integration
  blockchainTxHash: {
    type: String,
    sparse: true
  },
  
  blockchainOrderId: {
    type: String,
    sparse: true
  },
  
  blockchainStatus: {
    type: String,
    enum: ['pending', 'created', 'delivered', 'paid', 'cancelled', 'failed'],
    default: 'pending'
  },
  
  escrowAmount: {
    type: String, // Wei amount as string (BigNumber)
    default: '0'
  },
  
  // Order status
  status: {
    type: String,
    enum: ['draft', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Payment status
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'refunded'],
    default: 'unpaid'
  },
  
  // Important dates
  orderDate: {
    type: Date,
    default: Date.now
  },
  
  expectedDelivery: Date,
  actualDelivery: Date,
  
  deliveryConfirmedAt: Date,
  paymentReleasedAt: Date,
  
  // Shipping details
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  
  // Notes and metadata
  notes: String,
  internalNotes: String,
  
  // Invoice reference
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  
  // Audit trail
  history: [{
    action: String,
    status: String,
    timestamp: { type: Date, default: Date.now },
    performedBy: String,
    notes: String,
    txHash: String
  }]
  
}, {
  timestamps: true
});

// Pre-save: Calculate totals
orderSchema.pre('save', function(next) {
  // Calculate item totals
  this.items.forEach(item => {
    item.totalPrice = item.quantity * item.unitPrice;
  });
  
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calculate tax
  this.taxAmount = (this.subtotal * this.taxRate) / 100;
  
  // Calculate total
  this.total = this.subtotal + this.taxAmount - this.discount;
  
  next();
});

// Method to add history entry
orderSchema.methods.addHistory = function(action, status, performedBy, notes, txHash) {
  this.history.push({
    action,
    status,
    performedBy,
    notes,
    txHash,
    timestamp: new Date()
  });
  return this.save();
};

// Method to update blockchain status
orderSchema.methods.updateBlockchainStatus = function(status, txHash) {
  this.blockchainStatus = status;
  if (txHash) this.blockchainTxHash = txHash;
  return this.addHistory('blockchain_update', status, 'system', `Blockchain status: ${status}`, txHash);
};

// Index for lookups
orderSchema.index({ orderId: 1 });
orderSchema.index({ blockchainTxHash: 1 });
orderSchema.index({ status: 1, orderDate: -1 });

module.exports = mongoose.model('Order', orderSchema);
