/**
 * Vendor Model - MongoDB Schema
 * Supplier/Vendor management with trust score tracking
 */
const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  // Vendor ID
  vendorId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Basic info
  name: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true
  },
  
  company: {
    type: String,
    trim: true
  },
  
  // Contact info
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  
  phone: {
    type: String,
    trim: true
  },
  
  // Blockchain wallet address for payments
  walletAddress: {
    type: String,
    sparse: true
  },
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    zipCode: String
  },
  
  // Tax info
  gstin: String,
  pan: String,
  
  // Categories they supply
  categories: [{
    type: String,
    trim: true
  }],
  
  // Trust Score (calculated from blockchain + order history)
  trustScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  
  // Trust score components
  trustMetrics: {
    totalOrders: { type: Number, default: 0 },
    successfulOrders: { type: Number, default: 0 },
    deliveryDelays: { type: Number, default: 0 },
    qualityIssues: { type: Number, default: 0 },
    averageDeliveryDays: { type: Number, default: 0 },
    lastOrderDate: Date,
    contractExecutions: { type: Number, default: 0 },
    failedContracts: { type: Number, default: 0 }
  },
  
  // Rating from manual reviews (1-5)
  rating: {
    type: Number,
    default: 3,
    min: 1,
    max: 5
  },
  
  reviewCount: {
    type: Number,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'blacklisted', 'pending_verification'],
    default: 'active'
  },
  
  // Payment terms
  paymentTerms: {
    type: String,
    enum: ['immediate', 'net15', 'net30', 'net45', 'net60'],
    default: 'net30'
  },
  
  preferredPaymentMethod: {
    type: String,
    enum: ['bank_transfer', 'blockchain', 'upi', 'cheque'],
    default: 'bank_transfer'
  },
  
  // Bank details for payments
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String
  },
  
  // Notes
  notes: String,
  
  // Products supplied
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
  
}, {
  timestamps: true
});

// Method to calculate and update trust score
vendorSchema.methods.calculateTrustScore = function() {
  const metrics = this.trustMetrics;
  
  if (metrics.totalOrders === 0) {
    this.trustScore = 50; // Default for new vendors
    return this.trustScore;
  }
  
  // Success rate (40 points max)
  const successRate = (metrics.successfulOrders / metrics.totalOrders) * 40;
  
  // On-time delivery bonus (30 points max)
  const onTimeRate = ((metrics.totalOrders - metrics.deliveryDelays) / metrics.totalOrders) * 30;
  
  // Quality score (20 points max)
  const qualityScore = ((metrics.totalOrders - metrics.qualityIssues) / metrics.totalOrders) * 20;
  
  // Contract execution bonus (10 points max)
  const contractScore = metrics.contractExecutions > 0 
    ? ((metrics.contractExecutions - metrics.failedContracts) / metrics.contractExecutions) * 10
    : 5;
  
  // Calculate total
  this.trustScore = Math.min(100, Math.max(0, Math.round(successRate + onTimeRate + qualityScore + contractScore)));
  
  return this.trustScore;
};

// Method to record order completion
vendorSchema.methods.recordOrderCompletion = function(isSuccessful, daysToDeliver, hadQualityIssue, blockchainExecuted) {
  this.trustMetrics.totalOrders += 1;
  
  if (isSuccessful) {
    this.trustMetrics.successfulOrders += 1;
  }
  
  // Expected delivery is 7 days - if more, it's a delay
  if (daysToDeliver > 7) {
    this.trustMetrics.deliveryDelays += 1;
  }
  
  if (hadQualityIssue) {
    this.trustMetrics.qualityIssues += 1;
  }
  
  if (blockchainExecuted) {
    this.trustMetrics.contractExecutions += 1;
  }
  
  // Update average delivery days
  const prevTotal = this.trustMetrics.averageDeliveryDays * (this.trustMetrics.totalOrders - 1);
  this.trustMetrics.averageDeliveryDays = (prevTotal + daysToDeliver) / this.trustMetrics.totalOrders;
  
  this.trustMetrics.lastOrderDate = new Date();
  
  // Recalculate trust score
  this.calculateTrustScore();
  
  return this.save();
};

// Static method to get vendors by trust score
vendorSchema.statics.getByTrustScore = function(minScore = 0) {
  return this.find({ 
    trustScore: { $gte: minScore },
    status: 'active'
  }).sort({ trustScore: -1 });
};

// Pre-save: Generate vendor ID if new
vendorSchema.pre('save', async function(next) {
  if (!this.vendorId && this.isNew) {
    const count = await mongoose.model('Vendor').countDocuments();
    this.vendorId = `VND-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Index
vendorSchema.index({ vendorId: 1 });
vendorSchema.index({ walletAddress: 1 });
vendorSchema.index({ trustScore: -1 });

module.exports = mongoose.model('Vendor', vendorSchema);
