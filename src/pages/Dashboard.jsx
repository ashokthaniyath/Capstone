import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'

// Simple animated number component
function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const [displayed, setDisplayed] = useState(value)
  
  useEffect(() => {
    const duration = 500
    const steps = 20
    const increment = (value - displayed) / steps
    let current = displayed
    let step = 0
    
    const timer = setInterval(() => {
      step++
      current += increment
      setDisplayed(Math.round(current))
      if (step >= steps) {
        setDisplayed(value)
        clearInterval(timer)
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [value])
  
  return <>{prefix}{displayed.toLocaleString()}{suffix}</>
}

// Simple Line Chart using SVG
function SimpleLineChart({ data, height = 200 }) {
  if (!data || data.length === 0) return null
  
  const maxValue = Math.max(...data.map(d => d.value)) * 1.1
  const minValue = 0
  const width = 100
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((d.value - minValue) / (maxValue - minValue)) * height
    return `${x},${y}`
  }).join(' ')
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--erp-primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--erp-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill="url(#lineGradient)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="var(--erp-primary)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

// Simple Donut Chart
function SimpleDonutChart({ segments }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  let currentAngle = -90
  
  const paths = segments.map((segment, i) => {
    const angle = (segment.value / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle
    
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    
    const x1 = 50 + 40 * Math.cos(startRad)
    const y1 = 50 + 40 * Math.sin(startRad)
    const x2 = 50 + 40 * Math.cos(endRad)
    const y2 = 50 + 40 * Math.sin(endRad)
    
    const largeArc = angle > 180 ? 1 : 0
    
    return (
      <path
        key={i}
        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={segment.color}
        opacity={0.9}
      />
    )
  })
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
      <svg viewBox="0 0 100 100" style={{ width: 160, height: 160 }}>
        {paths}
        <circle cx="50" cy="50" r="25" fill="var(--card)" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-8)' }}>
            <span style={{ width: 12, height: 12, borderRadius: 'var(--radius-small)', background: s.color }} />
            <span style={{ color: 'var(--muted-foreground)' }}>{s.label}</span>
            <span style={{ fontWeight: 'var(--font-medium)', marginLeft: 'auto' }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const metrics = useStore((state) => state.metrics)
  const orders = useStore((state) => state.orders)
  const invoices = useStore((state) => state.invoices)
  const blockchainTxs = useStore((state) => state.blockchainTxs)
  const revenueHistory = useStore((state) => state.revenueHistory)
  const user = useStore((state) => state.user)
  const setActivePage = useStore((state) => state.setActivePage)
  const getOrderStats = useStore((state) => state.getOrderStats)
  const getInvoiceStats = useStore((state) => state.getInvoiceStats)

  const orderStats = getOrderStats()
  const invoiceStats = getInvoiceStats()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const [copiedHash, setCopiedHash] = useState(null)

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const donutSegments = [
    { label: 'Shipped', value: orderStats.shipped, color: '#8b5cf6' },
    { label: 'Processing', value: orderStats.processing, color: '#f59e0b' },
    { label: 'Delivered', value: orderStats.delivered, color: '#10b981' },
    { label: 'Cancelled', value: orderStats.cancelled, color: '#ef4444' },
    { label: 'Pending', value: orderStats.pending, color: '#94a3b8' },
  ]

  const getStatusClass = (status) => {
    const map = {
      'Pending': 'neutral',
      'Processing': 'warning', 
      'Shipped': 'info',
      'Delivered': 'success',
      'Cancelled': 'danger',
      'Paid': 'success',
      'Overdue': 'danger',
      'Draft': 'neutral',
      'Sent': 'info',
      'Verified': 'success',
    }
    return map[status] || 'neutral'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <header className="page-header">
        <h1 className="page-title">Welcome back, {user.name.split(' ')[0]}!</h1>
        <p className="page-subtitle">
          Here's what's happening with your business · {currentTime.toLocaleTimeString()}
        </p>
      </header>

      {/* KPI Cards */}
      <div className="data-grid data-grid-4">
        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div className="kpi-label">Total Revenue</div>
              <div className="kpi-value"><AnimatedNumber value={metrics.totalRevenue} prefix="₹" /></div>
              <div className="kpi-change positive">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                12.5%
              </div>
            </div>
            <div style={{ padding: 'var(--space-2)', background: 'color-mix(in srgb, var(--erp-success) 15%, transparent)', borderRadius: 'var(--radius-medium)', color: 'var(--erp-success)' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div className="kpi-label">Total Orders</div>
              <div className="kpi-value"><AnimatedNumber value={metrics.totalOrders} /></div>
              <div className="kpi-change positive">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                8.2%
              </div>
            </div>
            <div style={{ padding: 'var(--space-2)', background: 'color-mix(in srgb, var(--erp-primary) 15%, transparent)', borderRadius: 'var(--radius-medium)', color: 'var(--erp-primary)' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div className="kpi-label">Pending Orders</div>
              <div className="kpi-value"><AnimatedNumber value={metrics.pendingOrders} /></div>
              <div className="kpi-change positive">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                5.1%
              </div>
            </div>
            <div style={{ padding: 'var(--space-2)', background: 'color-mix(in srgb, var(--erp-warning) 15%, transparent)', borderRadius: 'var(--radius-medium)', color: 'var(--erp-warning)' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div className="kpi-label">Inventory Items</div>
              <div className="kpi-value"><AnimatedNumber value={12} /></div>
              <div className="kpi-change negative">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'rotate(180deg)' }}>
                  <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                2.4%
              </div>
            </div>
            <div style={{ padding: 'var(--space-2)', background: 'color-mix(in srgb, var(--erp-purple) 15%, transparent)', borderRadius: 'var(--radius-medium)', color: 'var(--erp-purple)' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="data-grid data-grid-2">
        {/* Revenue Chart */}
        <div className="chart-container">
          <div className="chart-title">Revenue Over Time</div>
          <p style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)', marginBottom: 'var(--space-4)', marginTop: 'calc(var(--space-1) * -1)' }}>Last 12 months</p>
          <SimpleLineChart data={revenueHistory} height={200} />
        </div>

        {/* Order Status */}
        <div className="chart-container">
          <div className="chart-title">Order Status Distribution</div>
          <p style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)', marginBottom: 'var(--space-4)', marginTop: 'calc(var(--space-1) * -1)' }}>Current breakdown</p>
          <SimpleDonutChart segments={donutSegments} />
        </div>
      </div>

      {/* Tables Row */}
      <div className="data-grid data-grid-2">
        {/* Recent Orders */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-6)' }}>Recent Orders</h3>
            <button className="ghost small" onClick={() => setActivePage('orders')}>
              View all →
            </button>
          </div>
          <div className="table">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 'var(--font-medium)' }}>{order.id}</td>
                    <td style={{ color: 'var(--muted-foreground)' }}>{order.customer}</td>
                    <td>₹{order.amount.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-6)' }}>Recent Invoices</h3>
            <button className="ghost small" onClick={() => setActivePage('invoices')}>
              View all →
            </button>
          </div>
          <div className="table">
            <table>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 5).map((invoice) => (
                  <tr key={invoice.id}>
                    <td style={{ fontWeight: 'var(--font-medium)' }}>{invoice.id}</td>
                    <td style={{ color: 'var(--muted-foreground)' }}>{invoice.customer}</td>
                    <td>₹{invoice.amount.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="data-grid data-grid-4">
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--text-7)', color: 'var(--muted-foreground)' }}>Pending Orders</p>
          <p style={{ fontSize: 'var(--text-2)', fontWeight: 'var(--font-bold)', marginTop: 'var(--space-1)' }}>
            <AnimatedNumber value={orderStats.pending} />
          </p>
        </div>
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--text-7)', color: 'var(--muted-foreground)' }}>Delivered</p>
          <p style={{ fontSize: 'var(--text-2)', fontWeight: 'var(--font-bold)', marginTop: 'var(--space-1)', color: 'var(--erp-success)' }}>
            <AnimatedNumber value={orderStats.delivered} />
          </p>
        </div>
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--text-7)', color: 'var(--muted-foreground)' }}>Paid Invoices</p>
          <p style={{ fontSize: 'var(--text-2)', fontWeight: 'var(--font-bold)', marginTop: 'var(--space-1)', color: 'var(--erp-success)' }}>
            <AnimatedNumber value={invoiceStats.paid} />
          </p>
        </div>
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--text-7)', color: 'var(--muted-foreground)' }}>Verified Txns</p>
          <p style={{ fontSize: 'var(--text-2)', fontWeight: 'var(--font-bold)', marginTop: 'var(--space-1)', color: 'var(--erp-primary)' }}>
            <AnimatedNumber value={blockchainTxs.filter(t => t.status === 'Verified').length} />
          </p>
        </div>
      </div>

      {/* Blockchain Activity Panel */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h3 style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-6)' }}>Blockchain Activity</h3>
            <span className="status-badge success" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <span style={{ width: 6, height: 6, background: 'currentColor', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
              Live
            </span>
          </div>
          <button className="ghost small" onClick={() => setActivePage('blockchain')}>
            View all {blockchainTxs.length} transactions
          </button>
        </div>
        <div>
          {blockchainTxs.slice(0, 6).map((tx) => (
            <div 
              key={tx.id}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--space-3)', 
                padding: 'var(--space-3) var(--space-4)',
                borderBottom: '1px solid var(--border)'
              }}
            >
              <span style={{ color: 'var(--erp-success)' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className={`status-badge ${tx.type === 'Order' ? 'info' : tx.type === 'Invoice' ? 'warning' : 'neutral'}`}>
                {tx.type}
              </span>
              <span style={{ fontSize: 'var(--text-7)', color: 'var(--muted-foreground)' }}>{tx.entityId}</span>
              <code style={{ fontSize: 'var(--text-8)', color: 'var(--erp-primary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tx.hash.slice(0, 12)}...
              </code>
              <button 
                onClick={() => copyHash(tx.hash)}
                className="icon-btn"
                style={{ width: '1.5rem', height: '1.5rem' }}
              >
                {copiedHash === tx.hash ? (
                  <span style={{ fontSize: '0.6rem', color: 'var(--erp-success)' }}>✓</span>
                ) : (
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
              <span className={`status-badge ${getStatusClass(tx.status)}`}>
                {tx.status}
              </span>
              <span style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)', marginLeft: 'auto' }}>
                {new Date(tx.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
