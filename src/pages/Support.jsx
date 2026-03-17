import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'

const assignees = ['Emily Williams', 'Jessica Brown', 'Amanda Martinez', 'John Smith', 'Robert Johnson', 'Michael Miller']

export default function Support() {
  const tickets = useStore((state) => state.tickets)
  const addTicket = useStore((state) => state.addTicket)
  const updateTicketStatus = useStore((state) => state.updateTicketStatus)
  const addToast = useStore((state) => state.addToast)
  const searchQuery = useStore((state) => state.searchQuery)
  const getTicketStats = useStore((state) => state.getTicketStats)

  const [showModal, setShowModal] = useState(false)
  const [localSearch, setLocalSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assignee: assignees[0],
    customer: ''
  })

  const stats = getTicketStats()

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const query = (localSearch || searchQuery).toLowerCase()
      const matchesSearch = !query || 
        t.title.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tickets, localSearch, searchQuery, statusFilter, priorityFilter])

  const handleStatusChange = (ticket) => {
    let nextStatus
    switch (ticket.status) {
      case 'open': nextStatus = 'in-progress'; break
      case 'in-progress': nextStatus = 'resolved'; break
      case 'resolved': nextStatus = 'closed'; break
      default: return
    }
    updateTicketStatus(ticket.id, nextStatus)
    addToast(`Ticket ${ticket.id} updated to ${nextStatus}`, 'success')
  }

  const getActionButton = (status) => {
    switch (status) {
      case 'open': return 'Start'
      case 'in-progress': return 'Resolve'
      case 'resolved': return 'Close'
      default: return null
    }
  }

  const getStatusClass = (status) => {
    const map = {
      'open': 'info',
      'in-progress': 'warning',
      'resolved': 'success',
      'closed': 'neutral',
    }
    return map[status] || 'neutral'
  }

  const getPriorityClass = (priority) => {
    const map = {
      'LOW': 'neutral',
      'MEDIUM': 'info',
      'HIGH': 'warning',
      'CRITICAL': 'danger',
    }
    return map[priority] || 'neutral'
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newTicket.title) {
      addToast('Please enter a title', 'warning')
      return
    }
    addTicket({ ...newTicket, status: 'open' })
    addToast('Ticket created successfully', 'success')
    setNewTicket({ title: '', description: '', priority: 'MEDIUM', assignee: assignees[0], customer: '' })
    setShowModal(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Support</h1>
          <p className="page-subtitle">Manage customer support tickets</p>
        </div>
        <button onClick={() => setShowModal(true)}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: 'var(--space-2)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Ticket
        </button>
      </header>

      {/* KPI Cards */}
      <div className="data-grid data-grid-4">
        <div className="kpi-card">
          <div className="kpi-label">Open</div>
          <div className="kpi-value" style={{ color: 'var(--erp-info)' }}>{stats.open}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">In Progress</div>
          <div className="kpi-value" style={{ color: 'var(--erp-warning)' }}>{stats.inProgress}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Resolved</div>
          <div className="kpi-value" style={{ color: 'var(--erp-success)' }}>{stats.resolved}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Critical</div>
          <div className="kpi-value" style={{ color: 'var(--erp-danger)' }}>{stats.critical}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <input
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search tickets..."
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
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="all">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {/* Ticket List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {filteredTickets.map((ticket) => {
          const actionLabel = getActionButton(ticket.status)
          return (
            <div key={ticket.id} className="card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <code style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>{ticket.id}</code>
                    <span className={`status-badge ${getStatusClass(ticket.status)}`}>{ticket.status}</span>
                    <span className={`status-badge ${getPriorityClass(ticket.priority)}`}>{ticket.priority}</span>
                  </div>
                  <h3 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>{ticket.title}</h3>
                  <p style={{ fontSize: 'var(--text-7)', color: 'var(--muted-foreground)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ticket.description}
                  </p>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
                  <div style={{ fontSize: 'var(--text-7)', color: 'var(--muted-foreground)' }}>{ticket.assignee}</div>
                  <div style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>{ticket.createdAt}</div>
                  {actionLabel && (
                    <button className="small" onClick={() => handleStatusChange(ticket)}>
                      {actionLabel}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Ticket Modal */}
      {showModal && (
        <dialog open style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-modal)', background: 'transparent', border: 'none' }}>
          <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowModal(false)}
          >
            <div className="card" style={{ width: '100%', maxWidth: '500px', padding: 0 }} onClick={(e) => e.stopPropagation()}>
              <header style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: 'var(--text-5)', fontWeight: 'var(--font-semibold)' }}>Create Support Ticket</h2>
                <button className="icon-btn" onClick={() => setShowModal(false)}>×</button>
              </header>
              
              <form onSubmit={handleSubmit} style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label>Title *</label>
                  <input
                    type="text"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket(t => ({ ...t, title: e.target.value }))}
                    placeholder="Brief description of the issue"
                  />
                </div>
                <div>
                  <label>Description</label>
                  <textarea
                    value={newTicket.description}
                    onChange={(e) => setNewTicket(t => ({ ...t, description: e.target.value }))}
                    placeholder="Detailed description..."
                    rows={3}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div>
                    <label>Priority</label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket(t => ({ ...t, priority: e.target.value }))}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label>Assignee</label>
                    <select
                      value={newTicket.assignee}
                      onChange={(e) => setNewTicket(t => ({ ...t, assignee: e.target.value }))}
                    >
                      {assignees.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
                  <button type="button" data-variant="secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit">Create Ticket</button>
                </div>
              </form>
            </div>
          </div>
        </dialog>
      )}
    </div>
  )
}
