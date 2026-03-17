import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'

export default function AuditLog() {
  const auditLog = useStore((state) => state.auditLog)
  const searchQuery = useStore((state) => state.searchQuery)
  const getAuditStats = useStore((state) => state.getAuditStats)
  const user = useStore((state) => state.user)
  const hasPermission = useStore((state) => state.hasPermission)
  const addToast = useStore((state) => state.addToast)

  const [localSearch, setLocalSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  const stats = getAuditStats()

  const actions = useMemo(() => {
    return [...new Set(auditLog.map(l => l.action))]
  }, [auditLog])

  const filteredLogs = useMemo(() => {
    return auditLog.filter(log => {
      const query = (localSearch || searchQuery).toLowerCase()
      const matchesSearch = !query || 
        log.action.toLowerCase().includes(query) ||
        log.user.toLowerCase().includes(query) ||
        log.entityId?.toLowerCase().includes(query)
      const matchesAction = actionFilter === 'all' || log.action === actionFilter
      return matchesSearch && matchesAction
    })
  }, [auditLog, localSearch, searchQuery, actionFilter])

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredLogs.slice(start, start + pageSize)
  }, [filteredLogs, currentPage])

  const totalPages = Math.ceil(filteredLogs.length / pageSize)

  const formatTimestamp = (ts) => {
    const date = new Date(ts)
    return date.toLocaleString()
  }

  // Check permission
  if (!hasPermission('view_audit')) {
    return (
      <div className="empty-state">
        <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>Access Restricted</h3>
        <p>You don't have permission to view the audit log. Contact an administrator for access.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <header className="page-header">
        <h1 className="page-title">Audit Log</h1>
        <p className="page-subtitle">Immutable record of all system activities</p>
      </header>

      {/* KPI Cards */}
      <div className="data-grid data-grid-4">
        <div className="kpi-card">
          <div className="kpi-label">Total Entries</div>
          <div className="kpi-value">{stats.total}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Today</div>
          <div className="kpi-value" style={{ color: 'var(--erp-primary)' }}>{stats.today}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">With Blockchain Hash</div>
          <div className="kpi-value" style={{ color: 'var(--erp-success)' }}>{stats.withHash}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active Users (24h)</div>
          <div className="kpi-value">{stats.activeUsers}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <input
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search audit log..."
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
        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1) }}>
          <option value="all">All Actions</option>
          {actions.map(action => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Entity ID</th>
                <th>Blockchain Hash</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: 'var(--text-7)', color: 'var(--muted-foreground)' }}>
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td style={{ fontWeight: 'var(--font-medium)' }}>{log.user}</td>
                  <td>
                    <span className="status-badge info">{log.action}</span>
                  </td>
                  <td>{log.entity}</td>
                  <td>
                    <code style={{ fontSize: 'var(--text-8)' }}>{log.entityId}</code>
                  </td>
                  <td>
                    {log.hash ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        <code 
                          title={log.hash}
                          style={{ fontSize: 'var(--text-8)', color: 'var(--erp-success)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', cursor: 'help' }}
                        >
                          {log.hash.slice(0, 16)}...
                        </code>
                        <button 
                          className="icon-btn" 
                          title="Copy full hash"
                          style={{ width: '1.5rem', height: '1.5rem', flexShrink: 0 }}
                          onClick={() => {
                            navigator.clipboard.writeText(log.hash)
                            addToast('Hash copied to clipboard', 'success')
                          }}
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--muted-foreground)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div style={{ 
          padding: 'var(--space-4)', 
          borderTop: '1px solid var(--border)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <span style={{ fontSize: 'var(--text-7)', color: 'var(--muted-foreground)' }}>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length}
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button 
              data-variant="secondary"
              className="small"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Previous
            </button>
            <button 
              data-variant="secondary"
              className="small"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div role="alert">
        <strong>Immutable Records:</strong> All audit log entries are cryptographically secured and cannot be modified or deleted.
      </div>
    </div>
  )
}
