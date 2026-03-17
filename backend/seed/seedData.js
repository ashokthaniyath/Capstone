/**
 * Seed Data Script
 * Populates the database with sample data for testing
 * Run: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Product, Order, Invoice, Vendor } = require('../models');
const barcodeService = require('../services/barcodeService');

const seedProducts = [
  {
    name: 'Enterprise Server Pro',
    sku: 'ENT-SRV-001',
    quantity: 29,
    price: 4342,
    costPrice: 3200,
    category: 'Hardware',
    description: 'High-performance enterprise server with 128GB RAM',
    reorderThreshold: 15
  },
  {
    name: 'Cloud Storage Solution',
    sku: 'CLD-STR-001',
    quantity: 388,
    price: 7457,
    costPrice: 5500,
    category: 'Software',
    description: '1TB cloud storage subscription - annual',
    reorderThreshold: 50
  },
  {
    name: 'Security Suite X',
    sku: 'SEC-STE-001',
    quantity: 390,
    price: 1151,
    costPrice: 800,
    category: 'Software',
    description: 'Enterprise security suite with firewall and antivirus',
    reorderThreshold: 100
  },
  {
    name: 'Network Switch 48-Port',
    sku: 'NET-SWT-001',
    quantity: 5,
    price: 2899,
    costPrice: 2100,
    category: 'Hardware',
    description: 'Managed 48-port Gigabit network switch',
    reorderThreshold: 10
  },
  {
    name: 'Wireless Access Point',
    sku: 'NET-WAP-001',
    quantity: 87,
    price: 459,
    costPrice: 320,
    category: 'Hardware',
    description: 'Dual-band WiFi 6 access point',
    reorderThreshold: 20
  },
  {
    name: 'UPS Battery Backup 3000VA',
    sku: 'PWR-UPS-001',
    quantity: 0,
    price: 1299,
    costPrice: 950,
    category: 'Hardware',
    description: 'Uninterruptible power supply for servers',
    reorderThreshold: 5
  },
  {
    name: 'CAT6 Ethernet Cable Bundle',
    sku: 'CBL-ETH-001',
    quantity: 450,
    price: 89,
    costPrice: 45,
    category: 'Accessories',
    description: 'Pack of 10x CAT6 cables (various lengths)',
    reorderThreshold: 100
  },
  {
    name: 'ERP License - Standard',
    sku: 'LIC-ERP-STD',
    quantity: 999,
    price: 2499,
    costPrice: 500,
    category: 'Software',
    description: 'BlockERP standard license - per user/year',
    reorderThreshold: 50
  }
];

const seedVendors = [
  {
    name: 'TechSupply Corp',
    company: 'TechSupply Corporation',
    email: 'orders@techsupply.com',
    phone: '+91 98765 43210',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f5cB1E',
    address: {
      street: '123 Tech Park',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      zipCode: '560001'
    },
    gstin: '29AABCT1234Q1Z5',
    categories: ['Hardware', 'Accessories'],
    paymentTerms: 'net30',
    trustScore: 85,
    trustMetrics: {
      totalOrders: 45,
      successfulOrders: 42,
      deliveryDelays: 3,
      qualityIssues: 1,
      averageDeliveryDays: 5,
      contractExecutions: 15,
      failedContracts: 0
    }
  },
  {
    name: 'CloudSoft Solutions',
    company: 'CloudSoft Solutions Pvt. Ltd.',
    email: 'sales@cloudsoft.io',
    phone: '+91 87654 32109',
    walletAddress: '0x8B3a08b22702cF6D8C47C4C5a5F38E2C8c1D2E3F',
    address: {
      street: '456 Software Lane',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      zipCode: '500081'
    },
    gstin: '36AABCS5678R1Z2',
    categories: ['Software', 'Cloud Services'],
    paymentTerms: 'net15',
    trustScore: 92,
    trustMetrics: {
      totalOrders: 78,
      successfulOrders: 76,
      deliveryDelays: 2,
      qualityIssues: 0,
      averageDeliveryDays: 3,
      contractExecutions: 25,
      failedContracts: 1
    }
  },
  {
    name: 'NetworkPro Distributors',
    company: 'NetworkPro Distributors',
    email: 'contact@networkpro.net',
    phone: '+91 76543 21098',
    walletAddress: '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
    address: {
      street: '789 Network Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      zipCode: '600001'
    },
    gstin: '33AABCN9012L1Z8',
    categories: ['Hardware', 'Networking'],
    paymentTerms: 'net45',
    trustScore: 65,
    trustMetrics: {
      totalOrders: 32,
      successfulOrders: 25,
      deliveryDelays: 8,
      qualityIssues: 4,
      averageDeliveryDays: 8,
      contractExecutions: 10,
      failedContracts: 2
    }
  }
];

const seedData = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/blockerp';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data (optional - uncomment to reset)
    // await Product.deleteMany({});
    // await Vendor.deleteMany({});
    // await Order.deleteMany({});
    // await Invoice.deleteMany({});
    // console.log('🗑️  Cleared existing data');
    
    // Seed Products
    console.log('\n📦 Seeding Products...');
    for (const productData of seedProducts) {
      const existing = await Product.findOne({ sku: productData.sku });
      if (existing) {
        console.log(`  ⏭️  Skipping ${productData.name} (exists)`);
        continue;
      }
      
      // Generate barcode
      productData.barcode = barcodeService.generateBarcodeString('PRD');
      
      const product = new Product(productData);
      await product.save();
      console.log(`  ✅ Created: ${product.name} (${product.barcode})`);
    }
    
    // Seed Vendors
    console.log('\n🏢 Seeding Vendors...');
    for (const vendorData of seedVendors) {
      const existing = await Vendor.findOne({ email: vendorData.email });
      if (existing) {
        console.log(`  ⏭️  Skipping ${vendorData.name} (exists)`);
        continue;
      }
      
      const vendor = new Vendor(vendorData);
      await vendor.save();
      console.log(`  ✅ Created: ${vendor.name} (${vendor.vendorId})`);
    }
    
    // Create a sample order
    console.log('\n📋 Creating Sample Order...');
    const existingOrder = await Order.findOne({ orderId: 'ORD-2026-00001' });
    if (!existingOrder) {
      const products = await Product.find().limit(3);
      const vendor = await Vendor.findOne();
      
      if (products.length > 0 && vendor) {
        const order = new Order({
          orderId: 'ORD-2026-00001',
          type: 'purchase',
          buyer: {
            name: 'BlockERP Demo User',
            email: 'demo@blockerp.com',
            address: '0x0000000000000000000000000000000000000000'
          },
          supplier: vendor._id,
          supplierDetails: {
            name: vendor.name,
            address: vendor.walletAddress
          },
          items: products.slice(0, 2).map(p => ({
            product: p._id,
            productName: p.name,
            sku: p.sku,
            quantity: 5,
            unitPrice: p.price,
            totalPrice: p.price * 5
          })),
          subtotal: products.slice(0, 2).reduce((sum, p) => sum + p.price * 5, 0),
          taxRate: 18,
          status: 'pending',
          blockchainStatus: 'pending'
        });
        
        await order.save();
        console.log(`  ✅ Created: ${order.orderId}`);
      }
    } else {
      console.log('  ⏭️  Sample order exists');
    }
    
    // Summary
    const productCount = await Product.countDocuments();
    const vendorCount = await Vendor.countDocuments();
    const orderCount = await Order.countDocuments();
    
    console.log('\n========================================');
    console.log('Seed Data Summary');
    console.log('========================================');
    console.log(`📦 Products: ${productCount}`);
    console.log(`🏢 Vendors:  ${vendorCount}`);
    console.log(`📋 Orders:   ${orderCount}`);
    console.log('========================================\n');
    
    console.log('✅ Seed data complete!');
    
  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedData();
