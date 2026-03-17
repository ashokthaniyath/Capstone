import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'

export default function Invoices() {
  const invoices = useStore((state) => state.invoices)
  const updateInvoiceStatus = useStore((state) => state.updateInvoiceStatus)
  const addToast = useStore((state) => state.addToast)
  const searchQuery = useStore((state) => state.searchQuery)
  const getInvoiceStats = useStore((state) => state.getInvoiceStats)
  const user = useStore((state) => state.user)

  const [localSearch, setLocalSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  const stats = getInvoiceStats()

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const query = (localSearch || searchQuery).toLowerCase()
      const matchesSearch = !query || 
        invoice.id.toLowerCase().includes(query) ||
        (invoice.customer || '').toLowerCase().includes(query)
      let matchesStatus = statusFilter === 'all'
      if (statusFilter === 'paid') matchesStatus = invoice.status === 'Paid'
      if (statusFilter === 'overdue') matchesStatus = invoice.status === 'Overdue'
      if (statusFilter === 'pending') matchesStatus = invoice.status === 'Draft' || invoice.status === 'Sent'
      return matchesSearch && matchesStatus
    })
  }, [invoices, localSearch, searchQuery, statusFilter])

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredInvoices.slice(start, start + pageSize)
  }, [filteredInvoices, currentPage])

  const totalPages = Math.ceil(filteredInvoices.length / pageSize)

  const handleStatusUpdate = (invoiceId, newStatus) => {
    if (user.role === 'viewer') {
      addToast('Viewers cannot update invoice status', 'error')
      return
    }
    updateInvoiceStatus(invoiceId, newStatus)
    addToast(`Invoice ${invoiceId} marked as ${newStatus}`, 'success')
    setSelectedInvoice(null)
  }

  const getStatusClass = (status) => {
    const map = {
      'Paid': 'success',
      'Draft': 'neutral',
      'Sent': 'info',
      'Overdue': 'danger',
    }
    return map[status] || 'neutral'
  }

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString()
  const formatCurrency = (value) => `₹${value.toLocaleString()}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Manage billing and payment tracking</p>
        </div>
        {user.role !== 'viewer' && (
          <button>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: 'var(--space-2)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Invoice
          </button>
        )}
      </header>

      {/* KPI Cards */}
      <div className="data-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="kpi-card">
          <div className="kpi-label">Total Invoices</div>
          <div className="kpi-value">{stats.total}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Paid</div>
          <div className="kpi-value" style={{ color: 'var(--erp-success)' }}>{stats.paid}</div>
          <div style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>{formatCurrency(stats.paidValue)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Pending</div>
          <div className="kpi-value" style={{ color: 'var(--erp-warning)' }}>{stats.pending}</div>
          <div style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>{formatCurrency(stats.pendingValue)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Overdue</div>
          <div className="kpi-value" style={{ color: 'var(--erp-danger)' }}>{stats.overdue}</div>
          <div style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>{formatCurrency(stats.overdueValue)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Value</div>
          <div className="kpi-value" style={{ color: 'var(--erp-primary)' }}>{formatCurrency(stats.totalValue)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <input
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search invoices..."
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
        
        <div role="tablist" style={{ display: 'flex' }}>
          {['all', 'paid', 'pending', 'overdue'].map((status, i, arr) => (
            <button
              key={status}
              role="tab"
              aria-selected={statusFilter === status}
              onClick={() => { setStatusFilter(status); setCurrentPage(1) }}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                fontSize: 'var(--text-7)',
                fontWeight: 'var(--font-medium)',
                textTransform: 'capitalize',
                border: '1px solid var(--border)',
                borderRight: i === arr.length - 1 ? '1px solid var(--border)' : 'none',
                borderRadius: i === 0 ? 'var(--radius-medium) 0 0 var(--radius-medium)' : i === arr.length - 1 ? '0 var(--radius-medium) var(--radius-medium) 0' : '0',
                background: statusFilter === status ? 'var(--erp-primary)' : 'var(--background)',
                color: statusFilter === status ? 'white' : 'var(--foreground)',
                cursor: 'pointer'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table">
          <table>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.map((invoice) => (
                <tr 
                  key={invoice.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <td style={{ fontWeight: 'var(--font-medium)', color: 'var(--erp-primary)' }}>{invoice.id}</td>
                  <td>{invoice.customer}</td>
                  <td style={{ color: 'var(--muted-foreground)' }}>{formatDate(invoice.issueDate)}</td>
                  <td style={{ color: 'var(--muted-foreground)' }}>{formatDate(invoice.dueDate)}</td>
                  <td style={{ fontWeight: 'var(--font-medium)' }}>{formatCurrency(invoice.amount)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {user.role !== 'viewer' && invoice.status !== 'Paid' && (
                      <button 
                        className="small"
                        onClick={() => handleStatusUpdate(invoice.id, 'Paid')}
                      >
                        Mark Paid
                      </button>
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
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredInvoices.length)} of {filteredInvoices.length}
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

      {/* Invoice Detail Dialog */}
      {selectedInvoice && (
        <dialog open style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-modal)', background: 'transparent', border: 'none' }}>
          <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setSelectedInvoice(null)}
          >
            <div 
              className="card" 
              style={{ width: '100%', maxWidth: '500px', padding: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <header style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: 'var(--text-5)', fontWeight: 'var(--font-semibold)' }}>
                  Invoice {selectedInvoice.id}
                </h2>
                <button className="icon-btn" onClick={() => setSelectedInvoice(null)}>×</button>
              </header>
              
              <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div>
                    <label style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>Customer</label>
                    <p style={{ fontWeight: 'var(--font-medium)' }}>{selectedInvoice.customer}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>Amount</label>
                    <p style={{ fontWeight: 'var(--font-medium)' }}>{formatCurrency(selectedInvoice.amount)}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>Issue Date</label>
                    <p style={{ fontWeight: 'var(--font-medium)' }}>{formatDate(selectedInvoice.issueDate)}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>Due Date</label>
                    <p style={{ fontWeight: 'var(--font-medium)' }}>{formatDate(selectedInvoice.dueDate)}</p>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>Status</label>
                  <div style={{ marginTop: 'var(--space-1)' }}>
                    <span className={`status-badge ${getStatusClass(selectedInvoice.status)}`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                </div>

                {/* Blockchain & IPFS Verification */}
                {(selectedInvoice.txHash || selectedInvoice.ipfsCid) && (
                  <div style={{ padding: 'var(--space-3)', background: 'var(--muted)', borderRadius: 'var(--radius-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <label style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-semibold)' }}>Blockchain & IPFS</label>
                    {selectedInvoice.txHash && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>Tx Hash:</span>
                        <code style={{ fontSize: 'var(--text-9)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={selectedInvoice.txHash}>
                          {selectedInvoice.txHash.slice(0, 10)}...{selectedInvoice.txHash.slice(-8)}
                        </code>
                        <button className="icon-btn" style={{ fontSize: 'var(--text-8)', padding: '2px 6px' }} onClick={() => { navigator.clipboard.writeText(selectedInvoice.txHash); }} title="Copy hash">
                          &#x2398;
                        </button>
                      </div>
                    )}
                    {selectedInvoice.ipfsCid && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>IPFS CID:</span>
                        <code style={{ fontSize: 'var(--text-9)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={selectedInvoice.ipfsCid}>
                          {selectedInvoice.ipfsCid.slice(0, 12)}...{selectedInvoice.ipfsCid.slice(-6)}
                        </code>
                        <button className="icon-btn" style={{ fontSize: 'var(--text-8)', padding: '2px 6px' }} onClick={() => { navigator.clipboard.writeText(selectedInvoice.ipfsCid); }} title="Copy CID">
                          &#x2398;
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {user.role !== 'viewer' && selectedInvoice.status !== 'Paid' && (
                  <div style={{ paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
                    <button onClick={() => handleStatusUpdate(selectedInvoice.id, 'Paid')}>
                      Mark as Paid
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </dialog>
      )}
    </div>
  )
}
