import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'

export default function Blockchain() {
  const blockchainTxs = useStore((state) => state.blockchainTxs)
  const searchQuery = useStore((state) => state.searchQuery)
  const getBlockchainStats = useStore((state) => state.getBlockchainStats)

  const [localSearch, setLocalSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [copiedHash, setCopiedHash] = useState(null)

  const stats = getBlockchainStats()

  const types = useMemo(() => {
    return [...new Set(blockchainTxs.map(t => t.type))]
  }, [blockchainTxs])

  const filteredTxs = useMemo(() => {
    return blockchainTxs.filter(tx => {
      const query = (localSearch || searchQuery).toLowerCase()
      const matchesSearch = !query || 
        tx.hash.toLowerCase().includes(query) ||
        tx.entityId?.toLowerCase().includes(query) ||
        tx.type.toLowerCase().includes(query)
      const matchesType = typeFilter === 'all' || tx.type === typeFilter
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter
      return matchesSearch && matchesType && matchesStatus
    })
  }, [blockchainTxs, localSearch, searchQuery, typeFilter, statusFilter])

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const getStatusClass = (status) => {
    const map = {
      'Verified': 'success',
      'Pending': 'warning',
      'Failed': 'danger',
    }
    return map[status] || 'neutral'
  }

  const getTypeClass = (type) => {
    const map = {
      'Order': 'info',
      'Invoice': 'warning',
      'Inventory': 'success',
      'Audit': 'neutral',
    }
    return map[type] || 'neutral'
  }

  const formatTimestamp = (ts) => {
    const date = new Date(ts)
    return date.toLocaleString()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Blockchain</h1>
          <p className="page-subtitle">Track all blockchain-verified transactions</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ width: 10, height: 10, background: 'var(--erp-success)', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 'var(--text-7)', color: 'var(--muted-foreground)' }}>Network Connected</span>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="data-grid data-grid-4">
        <div className="kpi-card">
          <div className="kpi-label">Total Transactions</div>
          <div className="kpi-value">{stats.total}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Verified</div>
          <div className="kpi-value" style={{ color: 'var(--erp-success)' }}>{stats.verified}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Pending</div>
          <div className="kpi-value" style={{ color: 'var(--erp-warning)' }}>{stats.pending}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Success Rate</div>
          <div className="kpi-value" style={{ color: 'var(--erp-primary)' }}>
            {stats.total > 0 ? ((stats.verified / stats.total) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <input
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by hash, entity ID..."
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
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          {types.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="Verified">Verified</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Type</th>
                <th>Entity ID</th>
                <th>Transaction Hash</th>
                <th>Confirmations</th>
                <th>Timestamp</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxs.slice(0, 50).map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <span className={`status-badge ${getStatusClass(tx.status)}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getTypeClass(tx.type)}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td>
                    <code style={{ fontSize: 'var(--text-8)' }}>{tx.entityId}</code>
                  </td>
                  <td>
                    <code style={{ fontSize: 'var(--text-8)', color: 'var(--erp-primary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                      {tx.hash}
                    </code>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <span style={{ 
                        width: 8, height: 8, 
                        background: tx.confirmations >= 6 ? 'var(--erp-success)' : tx.confirmations >= 3 ? 'var(--erp-warning)' : 'var(--muted-foreground)',
                        borderRadius: '50%'
                      }} />
                      {tx.confirmations || 0}/6
                    </span>
                  </td>
                  <td style={{ fontSize: 'var(--text-7)', color: 'var(--muted-foreground)' }}>
                    {formatTimestamp(tx.timestamp)}
                  </td>
                  <td>
                    <button 
                      className="icon-btn"
                      onClick={() => copyHash(tx.hash)}
                      title="Copy hash"
                    >
                      {copiedHash === tx.hash ? (
                        <svg width="14" height="14" fill="none" stroke="var(--erp-success)" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div role="alert" data-variant="success">
        <strong>Blockchain Security:</strong> All transactions are cryptographically signed and immutably recorded on the blockchain for audit and compliance purposes.
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
