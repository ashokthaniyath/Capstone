/**
 * Product Model - MongoDB Schema
 * Includes barcode support for inventory tracking
 */
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Core product info
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  
  // SKU - Stock Keeping Unit
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  
  // Auto-generated barcode (EAN-13 or Code128)
  barcode: {
    type: String,
    unique: true,
    sparse: true // Allow null values to be non-unique
  },
  
  // Barcode type
  barcodeType: {
    type: String,
    enum: ['EAN13', 'CODE128', 'QR'],
    default: 'CODE128'
  },
  
  // Inventory quantity
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Quantity cannot be negative']
  },
  
  // Minimum stock threshold for reorder alerts
  reorderThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  
  // Cost price for profit calculation
  costPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Product category
  category: {
    type: String,
    trim: true,
    default: 'Uncategorized'
  },
  
  // Description
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  
  // Supplier reference
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  
  // Unit of measurement
  unit: {
    type: String,
    default: 'piece',
    enum: ['piece', 'kg', 'liter', 'meter', 'box', 'pack']
  },
  
  // Tax rate (GST percentage)
  taxRate: {
    type: Number,
    default: 18, // 18% GST default
    min: 0,
    max: 100
  },
  
  // Image URL
  imageUrl: String,
  
  // Location/Warehouse info
  warehouseLocation: {
    type: String,
    trim: true
  },
  
  // Track stock movements
  lastRestocked: Date,
  lastSold: Date
  
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking low stock
productSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.reorderThreshold;
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.costPrice === 0) return 100;
  return ((this.price - this.costPrice) / this.costPrice * 100).toFixed(2);
});

// Index for barcode lookup
productSchema.index({ barcode: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Static method to find by barcode
productSchema.statics.findByBarcode = function(barcode) {
  return this.findOne({ barcode: barcode });
};

// Static method to get low stock items
productSchema.statics.getLowStockItems = function() {
  return this.find({
    $expr: { $lte: ['$quantity', '$reorderThreshold'] },
    status: 'active'
  });
};

// Method to deduct stock
productSchema.methods.deductStock = async function(qty) {
  if (this.quantity < qty) {
    throw new Error(`Insufficient stock. Available: ${this.quantity}, Requested: ${qty}`);
  }
  this.quantity -= qty;
  this.lastSold = new Date();
  return this.save();
};

// Method to add stock
productSchema.methods.addStock = async function(qty) {
  this.quantity += qty;
  this.lastRestocked = new Date();
  return this.save();
};

// Pre-save hook to generate barcode if not exists
productSchema.pre('save', async function(next) {
  if (!this.barcode && this.isNew) {
    // Generate barcode based on timestamp and random number
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.barcode = `${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
