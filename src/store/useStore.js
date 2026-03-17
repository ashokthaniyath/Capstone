import { create } from 'zustand'
import { PRODUCTS, ORDERS, INVOICES, TICKETS, AUDIT_LOG, BLOCKCHAIN_TXS, REVENUE_HISTORY } from '../data/seed'

export const useStore = create((set, get) => ({
  // Navigation
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
  activePage: 'dashboard', // Alias for backward compatibility
  setActivePage: (page) => set({ currentPage: page, activePage: page }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Auth / RBAC
  user: {
    name: 'Alex Thompson',
    role: 'admin',
    initials: 'AT',
    email: 'alex@company.com',
    phone: '+1 (555) 123-4567',
    department: 'Operations'
  },
  setUser: (userData) => set((state) => ({ user: { ...state.user, ...userData } })),
  setUserRole: (role) => set((state) => ({ user: { ...state.user, role } })),
  
  // Role-based permissions
  roles: {
    admin: {
      label: 'Administrator',
      permissions: ['view_all', 'edit_all', 'delete_all', 'manage_users', 'view_analytics', 'view_blockchain', 'view_audit', 'manage_settings'],
      description: 'Full system access with all permissions'
    },
    manager: {
      label: 'Manager',
      permissions: ['view_all', 'edit_orders', 'edit_inventory', 'edit_customers', 'view_analytics', 'view_reports'],
      description: 'Can manage operations but not system settings'
    },
    viewer: {
      label: 'Viewer',
      permissions: ['view_dashboard', 'view_orders', 'view_customers', 'view_inventory'],
      description: 'Read-only access to basic data'
    }
  },
  hasPermission: (permission) => {
    const user = get().user
    const roles = get().roles
    const userRole = roles[user.role]
    if (!userRole) return false
    return userRole.permissions.includes(permission) || userRole.permissions.includes('view_all')
  },

  // Real-time metrics (Dashboard KPIs)
  metrics: {
    totalRevenue: 2541768,
    totalOrders: 100,
    pendingOrders: 30,
  },
  updateMetrics: (options = {}) => set((state) => {
    if (options.revenueOnly) {
      return {
        metrics: {
          ...state.metrics,
          totalRevenue: state.metrics.totalRevenue + (options.delta || Math.floor(Math.random() * 1600) + 200)
        }
      }
    }
    return {
      metrics: {
        totalRevenue: state.metrics.totalRevenue + Math.floor(Math.random() * 7300) + 1200,
        totalOrders: state.metrics.totalOrders + (Math.random() > 0.5 ? 1 : 0),
        pendingOrders: Math.max(0, state.metrics.pendingOrders + Math.floor(Math.random() * 5) - 2),
      }
    }
  }),

  // Revenue History for charts
  revenueHistory: [...REVENUE_HISTORY],
  
  // Orders
  orders: [...ORDERS],
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  updateOrderStatus: (id, status) => set((state) => ({
    orders: state.orders.map(o => o.id === id ? { ...o, status } : o)
  })),

  // Invoices
  invoices: [...INVOICES],
  addInvoice: (invoice) => set((state) => ({ invoices: [invoice, ...state.invoices] })),
  updateInvoiceStatus: (id, status) => set((state) => ({
    invoices: state.invoices.map(i => i.id === id ? { ...i, status } : i)
  })),

  // Inventory
  inventory: [...PRODUCTS],
  restockProduct: (id, qty) => set((state) => ({
    inventory: state.inventory.map(p => {
      if (p.id === id) {
        const newStock = p.stock + qty
        return { 
          ...p, 
          stock: newStock, 
          status: newStock > p.reorderLevel ? 'In Stock' : newStock > 0 ? 'Low Stock' : 'Out of Stock',
          lastRestocked: new Date().toISOString().split('T')[0]
        }
      }
      return p
    })
  })),
  updateStockLevel: (id, delta) => set((state) => ({
    inventory: state.inventory.map(p => {
      if (p.id === id) {
        const newStock = Math.max(0, p.stock + delta)
        let status = p.status
        if (newStock <= 0) {
          status = 'Out of Stock'
        } else if (newStock <= p.reorderLevel) {
          status = 'Low Stock'
        } else {
          status = 'In Stock'
        }
        return { ...p, stock: newStock, status }
      }
      return p
    })
  })),

  // Support Tickets
  tickets: [...TICKETS],
  addTicket: (ticket) => set((state) => ({ 
    tickets: [{ 
      ...ticket, 
      id: `TKT-${String(state.tickets.length + 1).padStart(5, '0')}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    }, ...state.tickets] 
  })),
  updateTicketStatus: (id, status) => set((state) => ({
    tickets: state.tickets.map(t => t.id === id ? { ...t, status, updatedAt: new Date().toISOString().split('T')[0] } : t)
  })),

  // Audit Log
  auditLog: [...AUDIT_LOG],
  appendAuditEntry: (entry) => set((state) => ({
    auditLog: [entry, ...state.auditLog].slice(0, 500)
  })),

  // Blockchain Activity
  blockchainTxs: [...BLOCKCHAIN_TXS],
  appendBlockchainTx: (tx) => set((state) => ({
    blockchainTxs: [tx, ...state.blockchainTxs].slice(0, 500)
  })),

  // Vendor Trust Scores
  vendors: [
    { id: 1, name: 'ABC Traders', vendorId: 'VND-001', trustScore: 87, riskLevel: 'Low', totalOrders: 45, successfulOrders: 42, deliveryDelays: 3, avgDeliveryDays: 4.2, category: 'Hardware', email: 'abc@traders.com', phone: '+91 98765 43210', walletAddress: '0x1a2b3c4d5e6f...', lastOrderDate: '2026-03-12' },
    { id: 2, name: 'TechSupply Co', vendorId: 'VND-002', trustScore: 72, riskLevel: 'Medium', totalOrders: 30, successfulOrders: 24, deliveryDelays: 6, avgDeliveryDays: 6.8, category: 'Software', email: 'info@techsupply.co', phone: '+91 87654 32109', walletAddress: '0x2b3c4d5e6f7a...', lastOrderDate: '2026-03-08' },
    { id: 3, name: 'Global Parts Ltd', vendorId: 'VND-003', trustScore: 95, riskLevel: 'Low', totalOrders: 60, successfulOrders: 59, deliveryDelays: 1, avgDeliveryDays: 2.8, category: 'Accessories', email: 'contact@globalparts.com', phone: '+91 76543 21098', walletAddress: '0x3c4d5e6f7a8b...', lastOrderDate: '2026-03-15' },
    { id: 4, name: 'Metro Components', vendorId: 'VND-004', trustScore: 45, riskLevel: 'High', totalOrders: 20, successfulOrders: 12, deliveryDelays: 8, avgDeliveryDays: 11.5, category: 'Hardware', email: 'sales@metrocomp.in', phone: '+91 65432 10987', walletAddress: '0x4d5e6f7a8b9c...', lastOrderDate: '2026-02-20' },
    { id: 5, name: 'Precision Tools Inc', vendorId: 'VND-005', trustScore: 63, riskLevel: 'Medium', totalOrders: 35, successfulOrders: 27, deliveryDelays: 5, avgDeliveryDays: 7.1, category: 'Services', email: 'orders@precisiontools.com', phone: '+91 54321 09876', walletAddress: '0x5e6f7a8b9c0d...', lastOrderDate: '2026-03-01' },
  ],

  // Online/Offline state
  isOnline: true,
  setOnline: (status) => set({ isOnline: status }),
  syncQueue: [],
  addToSyncQueue: (item) => set((state) => ({ syncQueue: [...state.syncQueue, item] })),
  clearSyncQueue: () => set({ syncQueue: [] }),

  // Toast notifications
  toasts: [],
  addToast: (message, type = 'info') => set((state) => ({
    toasts: [...state.toasts, { id: Date.now(), message, type }]
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),

  // Modal
  modal: null,
  openModal: (type, data = {}) => set({ modal: { type, data } }),
  closeModal: () => set({ modal: null }),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Notifications count
  notificationCount: 2,
  incrementNotifications: () => set((state) => ({ notificationCount: state.notificationCount + 1 })),
  clearNotifications: () => set({ notificationCount: 0 }),

  // Settings state
  settingsTab: 'profile',
  setSettingsTab: (tab) => set({ settingsTab: tab }),
  
  // Notification settings
  notificationSettings: {
    email: true,
    sms: false,
    blockchain: true,
    lowStock: true,
    invoiceReminders: true,
    ticketUpdates: true,
  },
  toggleNotificationSetting: (key) => set((state) => ({
    notificationSettings: {
      ...state.notificationSettings,
      [key]: !state.notificationSettings[key]
    }
  })),

  // Appearance settings
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  accentColor: '#4361ee',
  setAccentColor: (color) => set({ accentColor: color }),
  density: 'normal',
  setDensity: (density) => set({ density }),

  // Computed selectors
  getOrderStats: () => {
    const orders = get().orders
    return {
      total: orders.length,
      processing: orders.filter(o => o.status === 'Processing').length,
      shipped: orders.filter(o => o.status === 'Shipped').length,
      delivered: orders.filter(o => o.status === 'Delivered').length,
      cancelled: orders.filter(o => o.status === 'Cancelled').length,
      pending: orders.filter(o => o.status === 'Pending').length,
    }
  },
  getInvoiceStats: () => {
    const invoices = get().invoices
    const paidInvoices = invoices.filter(i => i.status === 'Paid')
    const overdueInvoices = invoices.filter(i => i.status === 'Overdue')
    const pendingInvoices = invoices.filter(i => i.status === 'Sent' || i.status === 'Draft')
    return {
      total: invoices.length,
      paid: paidInvoices.length,
      paidValue: paidInvoices.reduce((sum, i) => sum + i.amount, 0),
      overdue: overdueInvoices.length,
      overdueValue: overdueInvoices.reduce((sum, i) => sum + i.amount, 0),
      pending: pendingInvoices.length,
      pendingValue: pendingInvoices.reduce((sum, i) => sum + i.amount, 0),
      totalValue: invoices.reduce((sum, i) => sum + i.amount, 0),
    }
  },
  getInventoryStats: () => {
    const inventory = get().inventory
    return {
      total: inventory.length,
      inStock: inventory.filter(p => p.status === 'In Stock').length,
      lowStock: inventory.filter(p => p.status === 'Low Stock').length,
      outOfStock: inventory.filter(p => p.status === 'Out of Stock').length,
      totalValue: inventory.reduce((sum, p) => sum + (p.price * p.stock), 0),
    }
  },
  getTicketStats: () => {
    const tickets = get().tickets
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in-progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length,
      critical: tickets.filter(t => t.priority === 'CRITICAL').length,
    }
  },
  getBlockchainStats: () => {
    const txs = get().blockchainTxs
    return {
      total: txs.length,
      verified: txs.filter(t => t.status === 'Verified').length,
      pending: txs.filter(t => t.status === 'Pending').length,
      failed: 0,
    }
  },
  getAuditStats: () => {
    const logs = get().auditLog
    const today = new Date().toISOString().split('T')[0]
    const uniqueUsers = new Set(logs.filter(l => {
      const logDate = new Date(l.timestamp)
      const now = new Date()
      return (now - logDate) < 24 * 60 * 60 * 1000
    }).map(l => l.user))
    
    return {
      total: logs.length,
      today: logs.filter(l => l.timestamp.startsWith(today)).length,
      withHash: logs.filter(l => l.hash).length,
      activeUsers: uniqueUsers.size,
    }
  },
}))
