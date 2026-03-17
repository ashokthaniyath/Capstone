import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'

export default function Orders() {
  const orders = useStore((state) => state.orders)
  const updateOrderStatus = useStore((state) => state.updateOrderStatus)
  const addToast = useStore((state) => state.addToast)
  const searchQuery = useStore((state) => state.searchQuery)
  const getOrderStats = useStore((state) => state.getOrderStats)
  const user = useStore((state) => state.user)

  const [localSearch, setLocalSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  const stats = getOrderStats()

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const query = (localSearch || searchQuery).toLowerCase()
      const matchesSearch = !query || 
        order.id.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, localSearch, searchQuery, statusFilter])

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredOrders.slice(start, start + pageSize)
  }, [filteredOrders, currentPage])

  const totalPages = Math.ceil(filteredOrders.length / pageSize)

  const handleStatusUpdate = (orderId, newStatus) => {
    if (user.role === 'viewer') {
      addToast('Viewers cannot update order status', 'error')
      return
    }
    updateOrderStatus(orderId, newStatus)
    addToast(`Order ${orderId} updated to ${newStatus}`, 'success')
    setSelectedOrder(null)
  }

  const getStatusClass = (status) => {
    const map = {
      'Pending': 'neutral',
      'Processing': 'warning', 
      'Shipped': 'info',
      'Delivered': 'success',
      'Cancelled': 'danger',
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
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Manage and track all customer orders</p>
        </div>
        {user.role !== 'viewer' && (
          <button>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: 'var(--space-2)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Order
          </button>
        )}
      </header>

      {/* KPI Cards */}
      <div className="data-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="kpi-card">
          <div className="kpi-label">Total Orders</div>
          <div className="kpi-value">{stats.total}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Pending</div>
          <div className="kpi-value" style={{ color: 'var(--erp-warning)' }}>{stats.pending}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Processing</div>
          <div className="kpi-value" style={{ color: 'var(--erp-info)' }}>{stats.processing}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Shipped</div>
          <div className="kpi-value" style={{ color: 'var(--erp-purple)' }}>{stats.shipped}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Delivered</div>
          <div className="kpi-value" style={{ color: 'var(--erp-success)' }}>{stats.delivered}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <input
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search orders..."
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
          {['all', 'pending', 'processing', 'shipped', 'delivered'].map(status => (
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
                borderRight: status === 'delivered' ? '1px solid var(--border)' : 'none',
                borderRadius: status === 'all' ? 'var(--radius-medium) 0 0 var(--radius-medium)' : status === 'delivered' ? '0 var(--radius-medium) var(--radius-medium) 0' : '0',
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

      {/* Orders Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Blockchain</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => (
                <tr 
                  key={order.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedOrder(order)}
                >
                  <td style={{ fontWeight: 'var(--font-medium)', color: 'var(--erp-primary)' }}>{order.id}</td>
                  <td>{order.customer}</td>
                  <td style={{ color: 'var(--muted-foreground)' }}>{formatDate(order.date)}</td>
                  <td>{order.items}</td>
                  <td style={{ fontWeight: 'var(--font-medium)' }}>{formatCurrency(order.total || order.amount)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    {order.blockchainHash ? (
                      <span style={{ color: 'var(--erp-success)', fontSize: 'var(--text-7)' }}>✓ Verified</span>
                    ) : (
                      <span style={{ color: 'var(--muted-foreground)' }}>—</span>
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {user.role !== 'viewer' && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                      <select
                        value=""
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        style={{ fontSize: 'var(--text-8)', padding: 'var(--space-1) var(--space-2)' }}
                      >
                        <option value="">Update</option>
                        {order.status === 'Pending' && <option value="Processing">Processing</option>}
                        {order.status === 'Processing' && <option value="Shipped">Shipped</option>}
                        {order.status === 'Shipped' && <option value="Delivered">Delivered</option>}
                        <option value="Cancelled">Cancel</option>
                      </select>
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
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
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

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <dialog open style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-modal)', background: 'transparent', border: 'none' }}>
          <div 
            style={{ 
              position: 'fixed', 
              inset: 0, 
              background: 'rgba(0,0,0,0.5)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
            onClick={() => setSelectedOrder(null)}
          >
            <div 
              className="card" 
              style={{ 
                width: '100%', 
                maxWidth: '500px', 
                padding: 0,
                animation: 'popIn 0.2s ease-out'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <header style={{ 
                padding: 'var(--space-4)', 
                borderBottom: '1px solid var(--border)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}>
                <h2 style={{ fontSize: 'var(--text-5)', fontWeight: 'var(--font-semibold)' }}>
                  Order {selectedOrder.id}
                </h2>
                <button className="icon-btn" onClick={() => setSelectedOrder(null)}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </header>
              
              <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div>
                    <label style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>Customer</label>
                    <p style={{ fontWeight: 'var(--font-medium)' }}>{selectedOrder.customer}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>Order Date</label>
                    <p style={{ fontWeight: 'var(--font-medium)' }}>{formatDate(selectedOrder.date)}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>Items</label>
                    <p style={{ fontWeight: 'var(--font-medium)' }}>{selectedOrder.items} items</p>
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>Total</label>
                    <p style={{ fontWeight: 'var(--font-medium)' }}>{formatCurrency(selectedOrder.total || selectedOrder.amount)}</p>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>Status</label>
                  <div style={{ marginTop: 'var(--space-1)' }}>
                    <span className={`status-badge ${getStatusClass(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>

                {selectedOrder.blockchainHash && (
                  <div>
                    <label style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>Blockchain Hash</label>
                    <code style={{ 
                      display: 'block', 
                      fontSize: 'var(--text-8)', 
                      color: 'var(--erp-success)', 
                      wordBreak: 'break-all',
                      marginTop: 'var(--space-1)'
                    }}>
                      {selectedOrder.blockchainHash}
                    </code>
                  </div>
                )}

                {user.role !== 'viewer' && selectedOrder.status !== 'Delivered' && selectedOrder.status !== 'Cancelled' && (
                  <div style={{ paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
                    <label style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)', display: 'block', marginBottom: 'var(--space-2)' }}>
                      Update Status
                    </label>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      {selectedOrder.status === 'Pending' && (
                        <button className="small" onClick={() => handleStatusUpdate(selectedOrder.id, 'Processing')}>
                          Mark Processing
                        </button>
                      )}
                      {selectedOrder.status === 'Processing' && (
                        <button className="small" onClick={() => handleStatusUpdate(selectedOrder.id, 'Shipped')}>
                          Mark Shipped
                        </button>
                      )}
                      {selectedOrder.status === 'Shipped' && (
                        <button className="small" onClick={() => handleStatusUpdate(selectedOrder.id, 'Delivered')}>
                          Mark Delivered
                        </button>
                      )}
                      <button 
                        data-variant="secondary"
                        className="small"
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'Cancelled')}
                      >
                        Cancel Order
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </dialog>
      )}

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
