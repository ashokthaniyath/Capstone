import { useMemo } from 'react'
import { useStore } from '../store/useStore'

// Simple Bar Chart
function BarChart({ data, height = 200 }) {
  if (!data || data.length === 0) return null
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)', height }}>
      {data.map((item, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)' }}>
          <div 
            style={{ 
              width: '100%', 
              background: item.color || 'var(--erp-primary)',
              borderRadius: 'var(--radius-small) var(--radius-small) 0 0',
              height: `${(item.value / maxValue) * 100}%`,
              minHeight: 4,
              transition: 'height 0.3s ease'
            }} 
          />
          <span style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

// Simple Horizontal Bar Chart  
function HorizontalBarChart({ data }) {
  if (!data || data.length === 0) return null
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ width: 80, fontSize: 'var(--text-7)', color: 'var(--muted-foreground)' }}>{item.label}</span>
          <div style={{ flex: 1, height: 20, background: 'var(--muted)', borderRadius: 'var(--radius-small)', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${(item.value / maxValue) * 100}%`,
                height: '100%',
                background: item.color || 'var(--erp-primary)',
                borderRadius: 'var(--radius-small)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
          <span style={{ width: 40, fontSize: 'var(--text-7)', fontWeight: 'var(--font-medium)', textAlign: 'right' }}>{item.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function ERPAnalytics() {
  const orders = useStore((state) => state.orders)
  const invoices = useStore((state) => state.invoices)
  const inventory = useStore((state) => state.inventory)
  const getOrderStats = useStore((state) => state.getOrderStats)
  const getInvoiceStats = useStore((state) => state.getInvoiceStats)
  const getInventoryStats = useStore((state) => state.getInventoryStats)

  const orderStats = getOrderStats()
  const invoiceStats = getInvoiceStats()
  const inventoryStats = getInventoryStats()

  // Orders by month
  const ordersByMonth = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const counts = months.map(() => 0)
    orders.forEach(order => {
      const month = new Date(order.date).getMonth()
      counts[month]++
    })
    return months.map((m, i) => ({ label: m, value: counts[i], color: 'var(--erp-primary)' }))
  }, [orders])

  // Invoice status distribution
  const invoiceDistribution = useMemo(() => [
    { label: 'Paid', value: invoiceStats.paid, color: 'var(--erp-success)' },
    { label: 'Pending', value: invoiceStats.pending, color: 'var(--erp-warning)' },
    { label: 'Overdue', value: invoiceStats.overdue, color: 'var(--erp-danger)' },
  ], [invoiceStats])

  // Order status distribution
  const orderDistribution = useMemo(() => [
    { label: 'Delivered', value: orderStats.delivered, color: 'var(--erp-success)' },
    { label: 'Shipped', value: orderStats.shipped, color: 'var(--erp-purple)' },
    { label: 'Processing', value: orderStats.processing, color: 'var(--erp-warning)' },
    { label: 'Pending', value: orderStats.pending, color: 'var(--muted-foreground)' },
  ], [orderStats])

  // Top products by value
  const topProducts = useMemo(() => {
    return [...inventory]
      .sort((a, b) => (b.price * b.stock) - (a.price * a.stock))
      .slice(0, 5)
      .map(p => ({ 
        label: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name, 
        value: Math.round(p.price * p.stock / 1000),
        color: 'var(--erp-info)'
      }))
  }, [inventory])

  // Category distribution
  const categoryDistribution = useMemo(() => {
    const cats = {}
    inventory.forEach(p => {
      cats[p.category] = (cats[p.category] || 0) + 1
    })
    const colors = ['var(--erp-primary)', 'var(--erp-success)', 'var(--erp-warning)', 'var(--erp-purple)', 'var(--erp-info)']
    return Object.entries(cats).map(([label, value], i) => ({ label, value, color: colors[i % colors.length] }))
  }, [inventory])

  const formatCurrency = (value) => `₹${value.toLocaleString()}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <header className="page-header">
        <h1 className="page-title">ERP Analytics</h1>
        <p className="page-subtitle">Comprehensive business intelligence dashboard</p>
      </header>

      {/* Summary KPIs */}
      <div className="data-grid data-grid-4">
        <div className="kpi-card">
          <div className="kpi-label">Total Orders</div>
          <div className="kpi-value">{orderStats.total}</div>
          <div className="kpi-change positive">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            12%
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Invoice Value</div>
          <div className="kpi-value">{formatCurrency(invoiceStats.totalValue)}</div>
          <div className="kpi-change positive">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            8%
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Inventory Value</div>
          <div className="kpi-value">{formatCurrency(inventoryStats.totalValue)}</div>
          <div className="kpi-change negative">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'rotate(180deg)' }}>
              <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            3%
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Collection Rate</div>
          <div className="kpi-value">{invoiceStats.total > 0 ? ((invoiceStats.paid / invoiceStats.total) * 100).toFixed(0) : 0}%</div>
          <div className="kpi-change positive">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            5%
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="data-grid data-grid-2">
        <div className="chart-container">
          <div className="chart-title">Orders by Month</div>
          <BarChart data={ordersByMonth} height={180} />
        </div>
        <div className="chart-container">
          <div className="chart-title">Order Status Distribution</div>
          <HorizontalBarChart data={orderDistribution} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="data-grid data-grid-2">
        <div className="chart-container">
          <div className="chart-title">Invoice Status</div>
          <HorizontalBarChart data={invoiceDistribution} />
        </div>
        <div className="chart-container">
          <div className="chart-title">Products by Category</div>
          <HorizontalBarChart data={categoryDistribution} />
        </div>
      </div>

      {/* Top Products */}
      <div className="chart-container">
        <div className="chart-title">Top Products by Value (₹K)</div>
        <HorizontalBarChart data={topProducts} />
      </div>

      {/* Stats Summary */}
      <div className="data-grid data-grid-3">
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <h3 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>Order Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Delivered</span>
              <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--erp-success)' }}>{orderStats.delivered}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Shipped</span>
              <span style={{ fontWeight: 'var(--font-medium)' }}>{orderStats.shipped}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Processing</span>
              <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--erp-warning)' }}>{orderStats.processing}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Pending</span>
              <span style={{ fontWeight: 'var(--font-medium)' }}>{orderStats.pending}</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <h3 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>Invoice Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Paid</span>
              <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--erp-success)' }}>{formatCurrency(invoiceStats.paidValue)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Pending</span>
              <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--erp-warning)' }}>{formatCurrency(invoiceStats.pendingValue)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Overdue</span>
              <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--erp-danger)' }}>{formatCurrency(invoiceStats.overdueValue)}</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <h3 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>Inventory Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>In Stock</span>
              <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--erp-success)' }}>{inventoryStats.inStock}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Low Stock</span>
              <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--erp-warning)' }}>{inventoryStats.lowStock}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Out of Stock</span>
              <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--erp-danger)' }}>{inventoryStats.outOfStock}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
