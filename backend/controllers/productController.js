/**
 * Product Controller
 * Handles product/inventory operations with barcode support
 */

const { Product } = require('../models');
const barcodeService = require('../services/barcodeService');
const aiService = require('../services/aiService');

/**
 * Create a new product with auto-generated barcode
 * POST /api/product/create
 */
exports.createProduct = async (req, res) => {
  try {
    const { name, sku, quantity, price, costPrice, category, description, reorderThreshold } = req.body;
    
    // Validate required fields
    if (!name || !sku || !price) {
      return res.status(400).json({
        success: false,
        error: 'Name, SKU, and price are required'
      });
    }
    
    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        error: 'Product with this SKU already exists'
      });
    }
    
    // Auto-generate barcode
    const barcode = barcodeService.generateBarcodeString('PRD');
    
    // Create product
    const product = new Product({
      name,
      sku: sku.toUpperCase(),
      barcode,
      quantity: quantity || 0,
      price,
      costPrice: costPrice || 0,
      category: category || 'Uncategorized',
      description,
      reorderThreshold: reorderThreshold || 10
    });
    
    await product.save();
    
    // Generate barcode image
    const barcodeImage = await barcodeService.generateBarcodeBase64(barcode, 'CODE128');
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product,
        barcodeImage
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get product by barcode
 * GET /api/product/barcode/:code
 */
exports.getProductByBarcode = async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Barcode is required'
      });
    }
    
    const product = await Product.findByBarcode(code);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found with this barcode'
      });
    }
    
    // Generate fresh barcode image
    const barcodeImage = await barcodeService.generateBarcodeBase64(product.barcode, 'CODE128');
    
    res.json({
      success: true,
      data: {
        product,
        barcodeImage,
        isLowStock: product.isLowStock
      }
    });
  } catch (error) {
    console.error('Get product by barcode error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all inventory
 * GET /api/inventory
 */
exports.getInventory = async (req, res) => {
  try {
    const { page = 1, limit = 50, category, status, lowStock } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$reorderThreshold'] };
    }
    
    const products = await Product.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments(query);
    
    // Get AI suggestions for reordering
    const reorderSuggestions = aiService.suggestReorder(products);
    
    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        aiSuggestions: reorderSuggestions
      }
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Add stock to inventory
 * POST /api/inventory/add
 */
exports.addStock = async (req, res) => {
  try {
    const { productId, barcode, sku, quantity } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be greater than 0'
      });
    }
    
    let product;
    
    if (productId) {
      product = await Product.findById(productId);
    } else if (barcode) {
      product = await Product.findByBarcode(barcode);
    } else if (sku) {
      product = await Product.findOne({ sku: sku.toUpperCase() });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Product ID, barcode, or SKU is required'
      });
    }
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    const previousQuantity = product.quantity;
    await product.addStock(quantity);
    
    res.json({
      success: true,
      message: `Stock added successfully. ${previousQuantity} → ${product.quantity}`,
      data: {
        product,
        previousQuantity,
        addedQuantity: quantity,
        newQuantity: product.quantity
      }
    });
  } catch (error) {
    console.error('Add stock error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update inventory (deduct stock on sale)
 * POST /api/inventory/update
 */
exports.updateStock = async (req, res) => {
  try {
    const { productId, barcode, sku, quantity, action = 'deduct' } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be greater than 0'
      });
    }
    
    let product;
    
    if (productId) {
      product = await Product.findById(productId);
    } else if (barcode) {
      product = await Product.findByBarcode(barcode);
    } else if (sku) {
      product = await Product.findOne({ sku: sku.toUpperCase() });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Product ID, barcode, or SKU is required'
      });
    }
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    const previousQuantity = product.quantity;
    
    if (action === 'deduct') {
      await product.deductStock(quantity);
    } else if (action === 'add') {
      await product.addStock(quantity);
    } else if (action === 'set') {
      product.quantity = quantity;
      await product.save();
    }
    
    // Check if reorder is needed
    const reorderNeeded = product.isLowStock;
    
    // Emit real-time event via Socket.io
    req.app.get('io')?.emit('inventory:updated', {
      sku: product.sku,
      name: product.name,
      previousQuantity,
      newQuantity: product.quantity,
      action
    });
    if (reorderNeeded) {
      req.app.get('io')?.emit('inventory:low-stock', {
        sku: product.sku,
        name: product.name,
        quantity: product.quantity,
        threshold: product.reorderThreshold
      });
    }
    
    res.json({
      success: true,
      message: `Stock updated successfully. ${previousQuantity} → ${product.quantity}`,
      data: {
        product,
        previousQuantity,
        newQuantity: product.quantity,
        action,
        reorderNeeded,
        reorderSuggestion: reorderNeeded 
          ? `Stock is low (${product.quantity}/${product.reorderThreshold}). Consider reordering.`
          : null
      }
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Generate barcode image for a product
 * GET /api/product/:id/barcode
 */
exports.getProductBarcode = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    const barcodeImage = await barcodeService.generateBarcodeImage(product.barcode, 'CODE128');
    
    res.set('Content-Type', 'image/png');
    res.send(barcodeImage);
  } catch (error) {
    console.error('Get barcode error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get product label (barcode + QR)
 * GET /api/product/:id/label
 */
exports.getProductLabel = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    const label = await barcodeService.generateProductLabel(product);
    
    res.json({
      success: true,
      data: label
    });
  } catch (error) {
    console.error('Get product label error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get low stock items with AI suggestions
 * GET /api/inventory/low-stock
 */
exports.getLowStockItems = async (req, res) => {
  try {
    const products = await Product.getLowStockItems();
    const suggestions = aiService.suggestReorder(products);
    
    res.json({
      success: true,
      data: {
        count: products.length,
        products,
        aiSuggestions: suggestions
      }
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Scan barcode and auto-deduct (for POS)
 * POST /api/inventory/scan
 */
exports.scanBarcode = async (req, res) => {
  try {
    const { barcode, quantity = 1 } = req.body;
    
    if (!barcode) {
      return res.status(400).json({
        success: false,
        error: 'Barcode is required'
      });
    }
    
    // Parse barcode
    const parsed = barcodeService.parseBarcode(barcode);
    
    // Find product
    const product = await Product.findByBarcode(barcode);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        parsedBarcode: parsed
      });
    }
    
    // Deduct stock
    const previousQuantity = product.quantity;
    await product.deductStock(quantity);
    
    res.json({
      success: true,
      message: 'Product scanned and stock deducted',
      data: {
        product: {
          name: product.name,
          sku: product.sku,
          price: product.price,
          previousQuantity,
          newQuantity: product.quantity
        },
        parsedBarcode: parsed,
        isLowStock: product.isLowStock
      }
    });
    
    // Emit real-time event via Socket.io
    req.app.get('io')?.emit('inventory:updated', {
      sku: product.sku,
      name: product.name,
      previousQuantity,
      newQuantity: product.quantity,
      action: 'scan'
    });
    if (product.isLowStock) {
      req.app.get('io')?.emit('inventory:low-stock', {
        sku: product.sku,
        name: product.name,
        quantity: product.quantity,
        threshold: product.reorderThreshold
      });
    }
  } catch (error) {
    console.error('Scan barcode error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
