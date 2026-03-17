import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'

export default function Inventory() {
  const inventory = useStore((state) => state.inventory)
  const restockProduct = useStore((state) => state.restockProduct)
  const appendAuditEntry = useStore((state) => state.appendAuditEntry)
  const addToast = useStore((state) => state.addToast)
  const searchQuery = useStore((state) => state.searchQuery)
  const getInventoryStats = useStore((state) => state.getInventoryStats)

  const [localSearch, setLocalSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanBarcode, setScanBarcode] = useState('')
  const [showAiSuggestions, setShowAiSuggestions] = useState(true)

  const stats = getInventoryStats()

  const categories = useMemo(() => {
    return [...new Set(inventory.map(p => p.category))]
  }, [inventory])

  const filteredInventory = useMemo(() => {
    return inventory.filter(p => {
      const query = (localSearch || searchQuery).toLowerCase()
      const matchesSearch = !query || 
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query)
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [inventory, localSearch, searchQuery, categoryFilter, statusFilter])

  const handleRestock = (product) => {
    restockProduct(product.id, 100)
    appendAuditEntry({
      id: Date.now(),
      user: 'Alex Thompson',
      action: 'Restock initiated',
      entity: 'Product',
      entityId: product.sku,
      hash: `0x${Math.random().toString(16).slice(2, 42)}`,
      timestamp: new Date().toISOString(),
      details: `Restock order placed for ${product.name}`
    })
    addToast(`Restock order placed for ${product.name}`, 'success')
  }

  const handleScan = () => {
    if (!scanBarcode.trim()) return
    const product = inventory.find(p => p.sku.toLowerCase() === scanBarcode.trim().toLowerCase() || p.name.toLowerCase().includes(scanBarcode.trim().toLowerCase()))
    if (product) {
      if (product.stock <= 0) {
        addToast(`${product.name} is OUT OF STOCK — cannot deduct`, 'error')
      } else {
        restockProduct(product.id, -1) // deduct 1
        addToast(`Scanned: ${product.name} — stock reduced to ${Math.max(0, product.stock - 1)}`, 'success')
        appendAuditEntry({
          id: Date.now(),
          user: 'Alex Thompson',
          action: 'Barcode scan',
          entity: 'Product',
          entityId: product.sku,
          hash: `0x${Math.random().toString(16).slice(2, 42)}`,
          timestamp: new Date().toISOString(),
          details: `Barcode scan: deducted 1 unit of ${product.name}`
        })
      }
    } else {
      addToast(`Product not found for code: ${scanBarcode}`, 'error')
    }
    setScanBarcode('')
    setScannerOpen(false)
  }

  const lowStockItems = useMemo(() => {
    return inventory.filter(p => p.stock <= p.reorderLevel && p.stock > 0)
  }, [inventory])

  const maxStock = Math.max(...inventory.map(p => p.stock), 1)

  const getStatusClass = (status) => {
    const map = {
      'In Stock': 'success',
      'Low Stock': 'warning',
      'Out of Stock': 'danger',
    }
    return map[status] || 'neutral'
  }

  const formatCurrency = (value) => `₹${value.toLocaleString()}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <header className="page-header">
        <h1 className="page-title">Inventory</h1>
        <p className="page-subtitle">Track and manage your product stock levels</p>
      </header>

      {/* KPI Cards */}
      <div className="data-grid data-grid-4">
        <div className="kpi-card">
          <div className="kpi-label">Total Products</div>
          <div className="kpi-value">{stats.total}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">In Stock</div>
          <div className="kpi-value" style={{ color: 'var(--erp-success)' }}>{stats.inStock}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Low Stock</div>
          <div className="kpi-value" style={{ color: 'var(--erp-warning)' }}>{stats.lowStock}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Value</div>
          <div className="kpi-value">{formatCurrency(stats.totalValue)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <input
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search products..."
            style={{ paddingLeft: 'var(--space-10)' }}
          />
          <svg 
            width="18" height="18" 
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>

        <button data-variant="primary" onClick={() => setScannerOpen(true)} style={{ whiteSpace: 'nowrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Scan Barcode
          </span>
        </button>
      </div>

      {/* AI Reorder Suggestions Panel */}
      {showAiSuggestions && lowStockItems.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--erp-purple)', background: 'var(--faint)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h3 style={{ fontSize: 'var(--text-6)', fontWeight: 'var(--font-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', margin: 0 }}>
              <span style={{ background: 'var(--erp-purple)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-medium)', fontSize: 'var(--text-8)' }}>AI</span>
              Reorder Suggestions
            </h3>
            <button className="icon-btn" onClick={() => setShowAiSuggestions(false)} title="Dismiss">&times;</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {lowStockItems.slice(0, 5).map(product => (
              <div key={product.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', background: 'var(--card)', borderRadius: 'var(--radius-medium)', border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-7)' }}>{product.name}</span>
                  <span style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-8)', marginLeft: 'var(--space-2)' }}>
                    Stock: {product.stock} / Threshold: {product.reorderLevel}
                  </span>
                </div>
                <button className="small" onClick={() => handleRestock(product)} style={{ fontSize: 'var(--text-8)', whiteSpace: 'nowrap' }}>
                  Auto-Restock +100
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th style={{ width: '200px' }}>Stock Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((product) => {
                const stockPercent = Math.min(100, (product.stock / maxStock) * 100)
                const barColor = product.status === 'In Stock' ? 'var(--erp-success)' : 
                                 product.status === 'Low Stock' ? 'var(--erp-warning)' : 'var(--erp-danger)'
                
                return (
                  <tr key={product.id}>
                    <td style={{ fontWeight: 'var(--font-medium)' }}>{product.name}</td>
                    <td>
                      <code style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>{product.sku}</code>
                    </td>
                    <td>{product.category}</td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <div style={{ 
                          flex: 1, 
                          height: '8px', 
                          background: 'var(--muted)', 
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${stockPercent}%`, 
                            height: '100%', 
                            background: barColor,
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{ fontSize: 'var(--text-8)', fontWeight: 'var(--font-medium)', minWidth: '50px', textAlign: 'right' }}>
                          {product.stock} / {product.reorderLevel}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(product.status)}`}>
                        {product.status}
                      </span>
                    </td>
                    <td>
                      {(product.status === 'Low Stock' || product.status === 'Out of Stock') && (
                        <button 
                          className="small"
                          onClick={() => handleRestock(product)}
                        >
                          Restock
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStock > 0 && (
        <div role="alert" data-variant="warning">
          <strong>Low Stock Alert:</strong> {stats.lowStock} product(s) are running low on stock. Consider restocking soon.
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {scannerOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 'var(--z-modal)'
        }} onClick={() => setScannerOpen(false)}>
          <div className="card" style={{ maxWidth: 420, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-4)', fontWeight: 'var(--font-bold)', margin: 0 }}>Scan Barcode</h2>
              <button className="icon-btn" onClick={() => setScannerOpen(false)}>&times;</button>
            </div>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-7)', marginBottom: 'var(--space-4)' }}>
              Enter a product SKU or name to simulate a barcode scan. Stock will be deducted by 1 unit.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                type="text"
                value={scanBarcode}
                onChange={(e) => setScanBarcode(e.target.value)}
                placeholder="Enter SKU (e.g. SKU-FJKU09)..."
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                autoFocus
              />
              <button data-variant="primary" onClick={handleScan}>Scan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
