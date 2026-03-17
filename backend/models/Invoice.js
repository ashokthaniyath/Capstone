/**
 * Invoice Model - MongoDB Schema
 * Invoice record with PDF generation support
 */
const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  sku: String,
  barcode: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  taxRate: {
    type: Number,
    default: 18
  },
  taxAmount: Number,
  total: Number
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  // Invoice ID (human-readable format: INV-2024-00001)
  invoiceId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Reference to order
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  orderId: String,
  
  // Invoice type
  type: {
    type: String,
    enum: ['sales', 'purchase', 'credit_note', 'debit_note'],
    default: 'sales'
  },
  
  // Customer/Client details
  customer: {
    name: { type: String, required: true },
    email: String,
    phone: String,
    company: String,
    gstin: String, // GST Identification Number
    address: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: 'India' },
      zipCode: String
    }
  },
  
  // Seller details
  seller: {
    name: { type: String, default: 'BlockERP Solutions' },
    email: { type: String, default: 'billing@blockerp.com' },
    phone: String,
    company: String,
    gstin: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: 'India' },
      zipCode: String
    }
  },
  
  // Invoice items
  items: [invoiceItemSchema],
  
  // Financial summary
  subtotal: {
    type: Number,
    required: true
  },
  
  // Tax breakdown
  cgst: { type: Number, default: 0 }, // Central GST
  sgst: { type: Number, default: 0 }, // State GST
  igst: { type: Number, default: 0 }, // Integrated GST (inter-state)
  
  totalTax: {
    type: Number,
    default: 0
  },
  
  discount: {
    type: Number,
    default: 0
  },
  
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'fixed'
  },
  
  total: {
    type: Number,
    required: true
  },
  
  amountInWords: String,
  
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Dates
  invoiceDate: {
    type: Date,
    default: Date.now
  },
  
  dueDate: Date,
  
  // Payment info
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'overdue', 'cancelled'],
    default: 'unpaid'
  },
  
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'upi', 'credit_card', 'blockchain', 'other'],
    default: 'bank_transfer'
  },
  
  amountPaid: {
    type: Number,
    default: 0
  },
  
  balanceDue: Number,
  
  // Blockchain reference
  blockchainTxHash: String,
  
  // QR Code / Barcode for invoice
  qrCode: String, // Base64 encoded QR
  invoiceBarcode: String,
  
  // PDF storage
  pdfUrl: String,
  pdfPath: String,
  
  // IPFS storage (Pinata)
  ipfsCid: String,
  ipfsGatewayUrl: String,
  ipfsUploadedAt: Date,
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'paid', 'cancelled', 'void'],
    default: 'draft'
  },
  
  // Notes
  notes: String,
  termsAndConditions: {
    type: String,
    default: 'Payment due within 30 days. Thank you for your business!'
  },
  
  // Metadata
  sentAt: Date,
  viewedAt: Date,
  paidAt: Date,
  
  createdBy: String,
  lastModifiedBy: String
  
}, {
  timestamps: true
});

// Pre-save: Calculate totals and generate invoice ID
invoiceSchema.pre('save', async function(next) {
  // Calculate item totals
  this.items.forEach(item => {
    item.taxAmount = (item.unitPrice * item.quantity * item.taxRate) / 100;
    item.total = (item.unitPrice * item.quantity) + item.taxAmount;
  });
  
  // Calculate subtotal (before tax)
  this.subtotal = this.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  
  // Calculate total tax
  this.totalTax = this.items.reduce((sum, item) => sum + item.taxAmount, 0);
  
  // Split GST (assuming intra-state, so CGST + SGST)
  this.cgst = this.totalTax / 2;
  this.sgst = this.totalTax / 2;
  
  // Calculate total
  let discountAmount = this.discount;
  if (this.discountType === 'percentage') {
    discountAmount = (this.subtotal * this.discount) / 100;
  }
  
  this.total = this.subtotal + this.totalTax - discountAmount;
  this.balanceDue = this.total - this.amountPaid;
  
  // Update payment status based on amount paid
  if (this.amountPaid >= this.total) {
    this.paymentStatus = 'paid';
  } else if (this.amountPaid > 0) {
    this.paymentStatus = 'partial';
  }
  
  // Generate invoice ID if new
  if (!this.invoiceId && this.isNew) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Invoice').countDocuments({ 
      invoiceDate: { 
        $gte: new Date(year, 0, 1), 
        $lt: new Date(year + 1, 0, 1) 
      } 
    });
    this.invoiceId = `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  
  next();
});

// Index for lookups
invoiceSchema.index({ invoiceId: 1 });
invoiceSchema.index({ 'customer.email': 1 });
invoiceSchema.index({ status: 1, invoiceDate: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
