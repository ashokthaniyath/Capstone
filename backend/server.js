/**
 * BlockERP Backend Server
 * Main entry point for the Express.js server
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Import services
const blockchainService = require('./services/blockchainService');

// Import routes
const apiRoutes = require('./routes');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize Socket.io for real-time events
const corsOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5500',
  process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store io instance on app for use in controllers via req.app.get('io')
app.set('io', io);

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
  
  // Client reconnection triggers sync check
  socket.on('client:reconnected', () => {
    socket.emit('sync:required', { message: 'Please sync offline transactions' });
  });
});

// ============================================
// MIDDLEWARE
// ============================================

// CORS - Allow frontend connections
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files (invoices)
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'BlockERP API',
    version: '1.0.0',
    description: 'Blockchain-integrated ERP system with AI automation',
    endpoints: {
      health: '/api/health',
      products: '/api/product/*',
      inventory: '/api/inventory/*',
      orders: '/api/order/*',
      invoices: '/api/invoice/*',
      vendors: '/api/vendor/*',
      ai: '/api/ai/*',
      blockchain: '/api/blockchain/*'
    },
    documentation: '/api/docs'
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'BlockERP API Documentation',
    version: '1.0.0',
    endpoints: {
      'Product/Inventory': [
        { method: 'POST', path: '/api/product/create', description: 'Create product with auto-barcode' },
        { method: 'GET', path: '/api/product/barcode/:code', description: 'Get product by barcode' },
        { method: 'GET', path: '/api/inventory', description: 'Get all inventory' },
        { method: 'POST', path: '/api/inventory/add', description: 'Add stock' },
        { method: 'POST', path: '/api/inventory/update', description: 'Update/deduct stock' },
        { method: 'GET', path: '/api/inventory/low-stock', description: 'Get low stock items with AI' },
        { method: 'POST', path: '/api/inventory/scan', description: 'Scan barcode (POS)' }
      ],
      'Orders (Blockchain)': [
        { method: 'POST', path: '/api/order/create', description: 'Create order (blockchain)' },
        { method: 'POST', path: '/api/order/confirm-delivery', description: 'Confirm delivery' },
        { method: 'POST', path: '/api/order/release-payment', description: 'Release payment (after delivery)' },
        { method: 'GET', path: '/api/order/:orderId', description: 'Get order details' },
        { method: 'GET', path: '/api/orders', description: 'List all orders' }
      ],
      'Invoices': [
        { method: 'POST', path: '/api/invoice/generate', description: 'Generate invoice PDF' },
        { method: 'GET', path: '/api/invoice/download/:id', description: 'Download invoice PDF' },
        { method: 'GET', path: '/api/invoice/:id', description: 'Get invoice details' },
        { method: 'GET', path: '/api/invoices', description: 'List all invoices' }
      ],
      'Vendors (Trust Score)': [
        { method: 'GET', path: '/api/vendor/trust-score/:id', description: 'Get vendor trust score' },
        { method: 'POST', path: '/api/vendor/create', description: 'Create vendor' },
        { method: 'GET', path: '/api/vendors', description: 'List all vendors' },
        { method: 'GET', path: '/api/vendors/leaderboard', description: 'Trust score leaderboard' }
      ],
      'AI Assistant': [
        { method: 'POST', path: '/api/ai/suggest-reorder', description: 'Get reorder suggestions' },
        { method: 'GET', path: '/api/ai/explain-transaction/:id', description: 'Explain blockchain tx' },
        { method: 'GET', path: '/api/ai/status', description: 'AI service status' }
      ],
      'Blockchain': [
        { method: 'GET', path: '/api/blockchain/status', description: 'Blockchain connection status' },
        { method: 'GET', path: '/api/blockchain/order/:id', description: 'Get blockchain order' },
        { method: 'POST', path: '/api/blockchain/deploy', description: 'Deploy smart contract' }
      ]
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// ============================================
// DATABASE CONNECTION
// ============================================

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/blockerp';
    
    await mongoose.connect(mongoUri, {
      // useNewUrlParser and useUnifiedTopology are deprecated in newer mongoose versions
    });
    
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('⚠️  Server will run without database. Some features may not work.');
    return false;
  }
};

// ============================================
// BLOCKCHAIN INITIALIZATION
// ============================================

const initBlockchain = async () => {
  try {
    const privateKey = process.env.PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    if (!privateKey) {
      console.log('⚠️  PRIVATE_KEY not set. Blockchain features disabled.');
      console.log('   Set PRIVATE_KEY in .env to enable blockchain integration.');
      return false;
    }
    
    await blockchainService.initialize(privateKey, contractAddress);
    
    console.log('✅ Blockchain service initialized');
    
    if (!contractAddress) {
      console.log('📝 No CONTRACT_ADDRESS set. Deploy contract via /api/blockchain/deploy');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Blockchain initialization failed:', error.message);
    console.log('⚠️  Server will run without blockchain. On-chain features disabled.');
    return false;
  }
};

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  console.log('\n========================================');
  console.log('      BlockERP Backend Server');
  console.log('========================================\n');
  
  // Connect to MongoDB
  const dbConnected = await connectDB();
  
  // Initialize blockchain
  const bcInitialized = await initBlockchain();
  
  // Start Express server (using http server for Socket.io)
  server.listen(PORT, () => {
    console.log('\n========================================');
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('========================================');
    console.log(`📊 API Docs: http://localhost:${PORT}/api/docs`);
    console.log(`💊 Health:   http://localhost:${PORT}/api/health`);
    console.log(`🔌 Socket.io: ws://localhost:${PORT}`);
    console.log('========================================');
    console.log('Status:');
    console.log(`  Database:   ${dbConnected ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`  Blockchain: ${bcInitialized ? '✅ Initialized' : '⚠️  Disabled'}`);
    console.log(`  Socket.io:  ✅ Ready`);
    console.log('========================================\n');
  });
};

// Run server
startServer().catch(console.error);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
