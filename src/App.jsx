import { useEffect } from 'react'
import { useStore } from './store/useStore'
import { useRealTime } from './hooks/useRealTime'

// Pages
import Dashboard from './pages/Dashboard'
import ERPAnalytics from './pages/ERPAnalytics'
import Inventory from './pages/Inventory'
import Orders from './pages/Orders'
import Invoices from './pages/Invoices'
import Support from './pages/Support'
import AuditLog from './pages/AuditLog'
import Blockchain from './pages/Blockchain'
import Settings from './pages/Settings'
import DataAssistant from './pages/DataAssistant'
import Vendors from './pages/Vendors'

// Icons
const icons = {
  dashboard: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  ai: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  chart: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  blocks: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  cart: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  document: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  box: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  headset: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  clipboard: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  logout: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  vendors: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  bell: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  search: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  sun: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  moon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  menu: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
}

// Navigation items (pure ERP - no CRM)
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'data-assistant', label: 'AI Assistant', icon: 'ai', badge: 'AI' },
  { id: 'erp-analytics', label: 'Analytics', icon: 'chart' },
  { id: 'orders', label: 'Orders', icon: 'cart' },
  { id: 'invoices', label: 'Invoices', icon: 'document' },
  { id: 'inventory', label: 'Inventory', icon: 'box' },
  { id: 'vendors', label: 'Vendors', icon: 'vendors', badge: 'Trust' },
  { id: 'blockchain', label: 'Blockchain', icon: 'blocks' },
  { id: 'support', label: 'Support', icon: 'headset' },
  { id: 'audit', label: 'Audit Log', icon: 'clipboard' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

export default function App() {
  useRealTime()

  const currentPage = useStore((state) => state.currentPage)
  const setActivePage = useStore((state) => state.setActivePage)
  const theme = useStore((state) => state.theme)
  const setTheme = useStore((state) => state.setTheme)
  const user = useStore((state) => state.user)
  const toasts = useStore((state) => state.toasts) || []
  const removeToast = useStore((state) => state.removeToast)
  const notificationCount = useStore((state) => state.notificationCount) || 0
  const isOnline = useStore((state) => state.isOnline)
  const setOnline = useStore((state) => state.setOnline)
  const syncQueue = useStore((state) => state.syncQueue)

  // Debug log
  console.log('App rendering:', { currentPage, theme, user })

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Online/offline detection
  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    setOnline(navigator.onLine)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [setOnline])

  // Page routing
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />
      case 'data-assistant': return <DataAssistant />
      case 'erp-analytics': return <ERPAnalytics />
      case 'orders': return <Orders />
      case 'invoices': return <Invoices />
      case 'inventory': return <Inventory />
      case 'vendors': return <Vendors />
      case 'support': return <Support />
      case 'audit': return <AuditLog />
      case 'blockchain': return <Blockchain />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <div data-sidebar-layout style={{ minHeight: '100vh' }}>
      {/* Top Navigation */}
      <nav data-topnav style={{ 
        padding: 'var(--space-3) var(--space-4)', 
        borderBottom: '1px solid var(--border)',
        background: 'var(--background)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button data-sidebar-toggle className="icon-btn" aria-label="Toggle sidebar">
            {icons.menu}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--erp-primary)" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-5)' }}>BlockERP</span>
          </div>
        </div>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
          <input 
            type="search" 
            placeholder="Search orders, invoices, products..." 
            style={{ paddingLeft: 'var(--space-10)' }}
          />
          <span style={{ 
            position: 'absolute', 
            left: 'var(--space-3)', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: 'var(--muted-foreground)'
          }}>
            {icons.search}
          </span>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* Online/Offline indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: isOnline ? 'var(--green-2, #dcfce7)' : 'var(--red-2, #fee2e2)', fontSize: 'var(--text-8)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isOnline ? 'var(--green-9, #16a34a)' : 'var(--red-9, #dc2626)', display: 'inline-block' }} />
            <span style={{ fontWeight: 'var(--font-medium)', color: isOnline ? 'var(--green-11, #166534)' : 'var(--red-11, #991b1b)' }}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
            {!isOnline && syncQueue.length > 0 && (
              <span className="badge" style={{ marginLeft: 4, fontSize: '0.6rem', padding: '0 4px' }}>{syncQueue.length}</span>
            )}
          </div>
          <button className="icon-btn" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? icons.moon : icons.sun}
          </button>
          <button className="icon-btn" style={{ position: 'relative' }}>
            {icons.bell}
            {notificationCount > 0 && <span className="notification-dot" />}
          </button>
          <figure data-variant="avatar" style={{ width: '2rem', height: '2rem', background: 'var(--erp-primary)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: 'var(--text-8)', fontWeight: 'var(--font-medium)' }}>
            {user.initials}
          </figure>
        </div>
      </nav>

      {/* Sidebar */}
      <aside data-sidebar>
        <header style={{ borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <figure data-variant="avatar" style={{ width: '2.25rem', height: '2.25rem', background: 'var(--erp-primary)', color: 'white', fontSize: 'var(--text-8)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'var(--font-medium)' }}>
              {user.initials}
            </figure>
            <div>
              <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-7)' }}>{user.name}</div>
              <span className="badge" style={{ fontSize: '0.65rem', textTransform: 'capitalize', padding: '0.1rem 0.4rem' }}>{user.role}</span>
            </div>
          </div>
        </header>

        <nav>
          <ul>
            {navItems.map((item) => (
              <li key={item.id}>
                <a 
                  href="#" 
                  aria-current={currentPage === item.id ? 'page' : undefined}
                  onClick={(e) => { e.preventDefault(); setActivePage(item.id) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                >
                  {icons[item.icon]}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="badge" style={{ marginLeft: 'auto', background: 'var(--erp-purple)', color: 'white', fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                      {item.badge}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <footer style={{ borderTop: '1px solid var(--border)' }}>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--muted-foreground)', textDecoration: 'none', fontSize: 'var(--text-7)' }}>
            {icons.logout}
            <span>Logout</span>
          </a>
        </footer>
      </aside>

      {/* Main Content */}
      <main style={{ padding: 'var(--space-6)', background: 'var(--faint)' }}>
        {renderPage()}
      </main>

      {/* Toast Container */}
      <div className="toast-container bottom-right">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className="toast animate-slide-in" 
            data-variant={toast.type === 'error' ? 'danger' : toast.type === 'success' ? 'success' : toast.type === 'warning' ? 'warning' : undefined}
          >
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)}>&times;</button>
          </div>
        ))}
      </div>
    </div>
  )
}
