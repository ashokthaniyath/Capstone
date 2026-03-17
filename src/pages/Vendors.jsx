import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'

export default function Vendors() {
  const vendors = useStore((state) => state.vendors)
  const addToast = useStore((state) => state.addToast)

  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('trustScore')
  const [selectedVendor, setSelectedVendor] = useState(null)

  const filteredVendors = useMemo(() => {
    let result = vendors.filter(v => {
      const query = search.toLowerCase()
      return !query || v.name.toLowerCase().includes(query) || v.category.toLowerCase().includes(query) || v.vendorId.toLowerCase().includes(query)
    })
    result.sort((a, b) => sortBy === 'trustScore' ? b.trustScore - a.trustScore : a.name.localeCompare(b.name))
    return result
  }, [vendors, search, sortBy])

  const stats = useMemo(() => ({
    total: vendors.length,
    lowRisk: vendors.filter(v => v.riskLevel === 'Low').length,
    mediumRisk: vendors.filter(v => v.riskLevel === 'Medium').length,
    highRisk: vendors.filter(v => v.riskLevel === 'High').length,
    avgScore: Math.round(vendors.reduce((s, v) => s + v.trustScore, 0) / vendors.length)
  }), [vendors])

  const getTrustColor = (score) => {
    if (score >= 80) return 'var(--erp-success)'
    if (score >= 50) return 'var(--erp-warning)'
    return 'var(--erp-danger)'
  }

  const getRiskBadge = (level) => {
    const map = { Low: 'success', Medium: 'warning', High: 'danger' }
    return map[level] || 'neutral'
  }

  const getTrustBar = (score) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 120 }}>
      <div style={{ flex: 1, height: 8, background: 'var(--muted)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: getTrustColor(score), borderRadius: 'var(--radius-full)', transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontWeight: 'var(--font-semibold)', color: getTrustColor(score), fontSize: 'var(--text-7)', minWidth: 30 }}>{score}</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <header className="page-header">
        <h1 className="page-title">Vendors</h1>
        <p className="page-subtitle">Manage vendor relationships and trust scores</p>
      </header>

      {/* KPI Cards */}
      <div className="data-grid data-grid-4">
        <div className="kpi-card">
          <div className="kpi-label">Total Vendors</div>
          <div className="kpi-value">{stats.total}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Avg Trust Score</div>
          <div className="kpi-value" style={{ color: getTrustColor(stats.avgScore) }}>{stats.avgScore}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Low Risk</div>
          <div className="kpi-value" style={{ color: 'var(--erp-success)' }}>{stats.lowRisk}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">High Risk</div>
          <div className="kpi-value" style={{ color: 'var(--erp-danger)' }}>{stats.highRisk}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors..."
          />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: 'auto' }}>
          <option value="trustScore">Sort by Trust Score</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Vendor Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Category</th>
              <th>Trust Score</th>
              <th>Risk Level</th>
              <th>Orders</th>
              <th>Success Rate</th>
              <th>Delays</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.map((vendor) => (
              <tr key={vendor.id}>
                <td>
                  <div>
                    <div style={{ fontWeight: 'var(--font-medium)' }}>{vendor.name}</div>
                    <div style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>{vendor.vendorId}</div>
                  </div>
                </td>
                <td><span className="badge">{vendor.category}</span></td>
                <td>{getTrustBar(vendor.trustScore)}</td>
                <td><span className={`status-badge ${getRiskBadge(vendor.riskLevel)}`}>{vendor.riskLevel}</span></td>
                <td>{vendor.totalOrders}</td>
                <td style={{ color: getTrustColor(Math.round((vendor.successfulOrders / vendor.totalOrders) * 100)) }}>
                  {Math.round((vendor.successfulOrders / vendor.totalOrders) * 100)}%
                </td>
                <td>
                  <span style={{ color: vendor.deliveryDelays > 5 ? 'var(--erp-danger)' : 'var(--muted-foreground)' }}>
                    {vendor.deliveryDelays}
                  </span>
                </td>
                <td>
                  <button className="icon-btn" title="View Details" onClick={() => setSelectedVendor(vendor)}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {filteredVendors.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--muted-foreground)' }}>
                  No vendors found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Leaderboard Card */}
      <div className="card">
        <h3 style={{ fontSize: 'var(--text-5)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>
          Trust Score Leaderboard
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[...vendors].sort((a, b) => b.trustScore - a.trustScore).map((vendor, index) => (
            <div key={vendor.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: index < vendors.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{
                width: 28, height: 28, borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-8)', fontWeight: 'var(--font-bold)',
                background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'var(--muted)',
                color: index < 3 ? '#000' : 'var(--foreground)'
              }}>
                {index + 1}
              </span>
              <span style={{ flex: 1, fontWeight: 'var(--font-medium)' }}>{vendor.name}</span>
              <span className="badge" style={{ marginRight: 'var(--space-2)' }}>{vendor.category}</span>
              {getTrustBar(vendor.trustScore)}
            </div>
          ))}
        </div>
      </div>

      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 'var(--z-modal)'
        }} onClick={() => setSelectedVendor(null)}>
          <div className="card" style={{ maxWidth: 520, width: '90%', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-3)', fontWeight: 'var(--font-bold)', margin: 0 }}>{selectedVendor.name}</h2>
              <button className="icon-btn" onClick={() => setSelectedVendor(null)}>&times;</button>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
              <span className="badge">{selectedVendor.vendorId}</span>
              <span className="badge">{selectedVendor.category}</span>
              <span className={`status-badge ${getRiskBadge(selectedVendor.riskLevel)}`}>{selectedVendor.riskLevel} Risk</span>
            </div>

            {/* Trust Score Visual */}
            <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--faint)', borderRadius: 'var(--radius-large)', marginBottom: 'var(--space-4)' }}>
              <div style={{ fontSize: '3rem', fontWeight: 'var(--font-bold)', color: getTrustColor(selectedVendor.trustScore) }}>
                {selectedVendor.trustScore}
              </div>
              <div style={{ fontSize: 'var(--text-7)', color: 'var(--muted-foreground)' }}>Trust Score</div>
              <div style={{ marginTop: 'var(--space-2)' }}>{getTrustBar(selectedVendor.trustScore)}</div>
            </div>

            {/* Metrics Grid */}
            <div className="data-grid data-grid-2" style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ padding: 'var(--space-3)', background: 'var(--faint)', borderRadius: 'var(--radius-medium)' }}>
                <div style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>Total Orders</div>
                <div style={{ fontSize: 'var(--text-3)', fontWeight: 'var(--font-bold)' }}>{selectedVendor.totalOrders}</div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--faint)', borderRadius: 'var(--radius-medium)' }}>
                <div style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>Successful</div>
                <div style={{ fontSize: 'var(--text-3)', fontWeight: 'var(--font-bold)', color: 'var(--erp-success)' }}>{selectedVendor.successfulOrders}</div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--faint)', borderRadius: 'var(--radius-medium)' }}>
                <div style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>Delivery Delays</div>
                <div style={{ fontSize: 'var(--text-3)', fontWeight: 'var(--font-bold)', color: selectedVendor.deliveryDelays > 5 ? 'var(--erp-danger)' : 'var(--foreground)' }}>{selectedVendor.deliveryDelays}</div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--faint)', borderRadius: 'var(--radius-medium)' }}>
                <div style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>Avg Delivery</div>
                <div style={{ fontSize: 'var(--text-3)', fontWeight: 'var(--font-bold)' }}>{selectedVendor.avgDeliveryDays} days</div>
              </div>
            </div>

            {/* Contact Info */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-3)' }}>
              <h4 style={{ fontSize: 'var(--text-7)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>Contact</h4>
              <div style={{ fontSize: 'var(--text-7)', color: 'var(--muted-foreground)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <span>Email: {selectedVendor.email}</span>
                <span>Phone: {selectedVendor.phone}</span>
                <span>Wallet: {selectedVendor.walletAddress}</span>
                <span>Last Order: {selectedVendor.lastOrderDate}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
