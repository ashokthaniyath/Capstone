# BlockERP - Blockchain-Integrated ERP System

A complete Enterprise Resource Planning (ERP) system with blockchain integration, AI-assisted automation, barcode inventory tracking, and invoice generation.

## 🎯 Features

### 1. 🔗 Blockchain Integration (Polygon Mumbai)
- **Smart Contract**: `PurchaseOrder.sol` with escrow functionality
- **Payment Logic**: Payment ONLY released after delivery confirmation
- **Events**: OrderCreated, DeliveryConfirmed, PaymentReleased
- **Trust Scores**: Automatic vendor rating based on blockchain history

### 2. 📦 Barcode Inventory System
- Auto-generated barcodes for products (CODE128, EAN-13, QR)
- Scan-to-fetch product details
- Real-time stock deduction
- Low stock alerts with AI suggestions

### 3. 🧾 Invoice Generation + IPFS
- Professional PDF invoices with GST
- QR code verification
- Blockchain transaction reference
- IPFS pinning via Pinata (CID stored per invoice)
- Downloadable and stored records

### 4. 🤖 AI Assistant
- `suggestReorder()` - Smart inventory reorder suggestions
- `explainTransaction()` - Human-readable blockchain explanations
- `analyzeVendorRisk()` - Vendor risk assessment

### 5. 🔐 Vendor Trust Score System
- Based on: delivery delays, successful orders, contract execution
- Blockchain + database combined scoring
- Risk analysis and recommendations

### 6. 🔌 Real-Time Events (Socket.io)
- Live order/inventory/vendor events pushed to clients
- Events: order:created, order:delivered, inventory:updated, inventory:low-stock, vendor:trust-updated, invoice:generated, sync:complete

### 7. 📴 Offline-First Sync
- Idempotent transaction queue (deduplicated by clientId)
- Supports inventory_update, order, and invoice types
- Batch sync via POST `/api/sync`

### 8. 🔍 Audit Verification
- Cross-reference MongoDB + IPFS + blockchain per record
- GET `/api/audit/verify/:id` returns consolidated proof

## 📁 Project Structure

```
Capstone/
├── backend/                    # Node.js + Express backend
│   ├── controllers/            # Request handlers
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── invoiceController.js
│   │   ├── vendorController.js
│   │   ├── auditController.js
│   │   └── syncController.js
│   ├── models/                 # MongoDB schemas
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Invoice.js
│   │   └── Vendor.js
│   ├── routes/                 # API routes
│   │   └── index.js
│   ├── services/               # Business logic
│   │   ├── blockchainService.js
│   │   ├── aiService.js
│   │   ├── barcodeService.js
│   │   └── invoiceService.js
│   ├── seed/                   # Sample data
│   │   └── seedData.js
│   ├── server.js               # Entry point
│   ├── package.json
│   └── .env.example
├── contracts/                  # Solidity contracts
│   ├── PurchaseOrder.sol       # NEW: Escrow-based purchase orders
│   ├── BlockERPCore.sol
│   ├── InventoryManager.sol
│   └── ...
├── src/                        # React frontend (Vite)
└── hardhat.config.cjs          # Hardhat configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- MetaMask wallet with Mumbai testnet MATIC

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings:
# - MONGODB_URI (your MongoDB connection string)
# - PRIVATE_KEY (your wallet private key for blockchain)
# - CONTRACT_ADDRESS (leave empty initially)
```

### 3. Start MongoDB

**Option A: Local MongoDB**
```bash
# Make sure MongoDB is running
mongod
```

**Option B: MongoDB Atlas**
- Create free cluster at mongodb.com
- Get connection string and add to .env

### 4. Seed Sample Data

```bash
npm run seed
```

### 5. Start the Server

```bash
# Development mode (with hot reload)
npm run dev

# OR Production mode
npm start
```

Server runs at: http://localhost:3001

### 6. Compile Smart Contract (Optional - for blockchain features)

```bash
# In project root
npx hardhat compile
```

### 7. Open Frontend

```bash
# In project root
npm run dev
```

Frontend runs at: http://localhost:3000

## 📡 API Endpoints

### Products / Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/product/create` | Create product with auto-barcode |
| GET | `/api/product/barcode/:code` | Get product by barcode |
| GET | `/api/inventory` | List all inventory |
| POST | `/api/inventory/add` | Add stock |
| POST | `/api/inventory/update` | Update/deduct stock |
| GET | `/api/inventory/low-stock` | Low stock with AI suggestions |
| POST | `/api/inventory/scan` | Scan barcode (POS) |
| POST | `/api/sale/scan` | POS scan alias |
| GET | `/api/product/:id/barcode` | Product barcode image |
| GET | `/api/product/:id/label` | Product label (barcode + QR) |

### Orders (Blockchain)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/order/create` | Create order (triggers blockchain) |
| POST | `/api/order/confirm-delivery` | Confirm delivery |
| POST | `/api/order/release-payment` | Release payment (after delivery) |
| POST | `/api/order/cancel` | Cancel order |
| GET | `/api/order/:orderId` | Get order details |
| GET | `/api/orders` | List all orders |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/invoice/generate` | Generate PDF + IPFS pin |
| GET | `/api/invoice/download/:id` | Download PDF |
| GET | `/api/invoice/:id` | Get invoice (includes CID) |
| GET | `/api/invoices` | List all invoices |
| POST | `/api/invoice/:id/pay` | Mark invoice as paid |
| POST | `/api/invoice/:id/regenerate` | Regenerate PDF |

### Vendors (Trust Score)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vendor/trust-score/:id` | Get vendor trust score |
| POST | `/api/vendor/create` | Create vendor |
| GET | `/api/vendors` | List vendors |
| GET | `/api/vendor/:id` | Get vendor by ID |
| PUT | `/api/vendor/:id` | Update vendor |
| GET | `/api/vendors/leaderboard` | Trust score leaderboard |
| POST | `/api/vendor/:id/record-order` | Record order completion |

### AI Assistant
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/suggest-reorder` | Get reorder suggestions |
| GET | `/api/ai/explain-transaction/:id` | Explain blockchain tx |
| GET | `/api/ai/status` | AI service status |

### Audit Verification
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit/verify/:id` | Verify record (DB + IPFS + chain) |

### Offline Sync
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sync` | Sync offline transaction queue |

### Blockchain
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blockchain/status` | Connection status |
| GET | `/api/blockchain/order/:id` | Get on-chain order |
| POST | `/api/blockchain/deploy` | Deploy smart contract |

## 🧪 Demo Flow

The complete demo flow works as follows:

```
1. Create Product → Barcode auto-generated
2. Scan Barcode → Fetch product info
3. Create Order → Blockchain contract triggered (if enabled)
4. Confirm Delivery → Smart contract updated
5. Release Payment → Blockchain event emitted
6. Generate Invoice → Downloadable PDF
7. AI suggests reorder → Low stock alerts
```

### Run Demo via Browser Console

Open the frontend at http://localhost:3000, or test via Postman:

```javascript
// Check API connection
await checkAPIConnection();

// Run full demo
await runFullDemo();

// Or individual steps:
await demoCreateProduct();
await demoScanBarcode('barcode-here');
await demoCreateOrder();
await demoConfirmDelivery('ORD-2026-00001');
await demoReleasePayment('ORD-2026-00001');
await demoGenerateInvoice('ORD-2026-00001');
await demoGetAISuggestions();
```

## 🔗 Blockchain Setup (Polygon Mumbai)

### 1. Get Testnet MATIC
- Visit: https://faucet.polygon.technology/
- Select "Mumbai" network
- Enter your wallet address
- Get free test MATIC

### 2. Add Mumbai to MetaMask
- Network Name: Polygon Mumbai
- RPC URL: https://rpc-mumbai.maticvigil.com
- Chain ID: 80001
- Currency: MATIC

### 3. Export Private Key
- MetaMask → Account Details → Export Private Key
- Add to `.env` as `PRIVATE_KEY`

### 4. Deploy Contract
```bash
# Via API (after server starts)
curl -X POST http://localhost:3001/api/blockchain/deploy

# Or via Hardhat
npx hardhat run scripts/deploy.cjs --network mumbai
```

## 🛠️ Troubleshooting

### MongoDB Connection Failed
```
Error: MongoNetworkError
Solution: Ensure MongoDB is running or use MongoDB Atlas
```

### Blockchain Not Initialized
```
Warning: PRIVATE_KEY not set
Solution: Add your wallet private key to .env
```

### Contract Not Found
```
Error: Contract artifact not found
Solution: Run 'npx hardhat compile' first
```

### Insufficient Balance
```
Error: insufficient funds for gas
Solution: Get test MATIC from faucet
```

## 📝 Sample API Calls

### Create Product
```bash
curl -X POST http://localhost:3001/api/product/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "sku": "TEST-001",
    "quantity": 100,
    "price": 999
  }'
```

### Get Product by Barcode
```bash
curl http://localhost:3001/api/product/barcode/PRD123456789012
```

### Create Order
```bash
curl -X POST http://localhost:3001/api/order/create \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productName": "Test", "quantity": 5, "unitPrice": 999}],
    "buyer": {"name": "Test Buyer", "email": "test@example.com"},
    "useBlockchain": false
  }'
```

### Generate Invoice
```bash
curl -X POST http://localhost:3001/api/invoice/generate \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORD-2026-00001"}'
```

## 📄 License

MIT License - See LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

---

**BlockERP** - Blockchain-Integrated ERP System
Built with ❤️ using Node.js, MongoDB, Solidity, and oat UI
