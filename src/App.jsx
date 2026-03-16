import { useEffect } from 'react'
import { useStore } from './store/useStore'
import { useRealTime } from './hooks/useRealTime'
import Sidebar from './components/Layout/Sidebar'
import TopBar from './components/Layout/TopBar'
import Toast from './components/UI/Toast'

// Pages
import Dashboard from './pages/Dashboard'
import ERPAnalytics from './pages/ERPAnalytics'
import Customers from './pages/Customers'
import Inventory from './pages/Inventory'
import Orders from './pages/Orders'
import Invoices from './pages/Invoices'
import Support from './pages/Support'
import AuditLog from './pages/AuditLog'
import Blockchain from './pages/Blockchain'
import CRMAnalytics from './pages/CRMAnalytics'
import CRMERPIntegration from './pages/CRMERPIntegration'
import Settings from './pages/Settings'
import DataAssistant from './pages/DataAssistant'

export default function App() {
  // Initialize real-time updates
  useRealTime()

  const currentPage = useStore((state) => state.currentPage)
  const toasts = useStore((state) => state.toasts) || []
  const removeToast = useStore((state) => state.removeToast)
  const sidebarCollapsed = useStore((state) => state.sidebarCollapsed)

  // Page routing
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'data-assistant':
        return <DataAssistant />
      case 'erp-analytics':
        return <ERPAnalytics />
      case 'crm-erp':
        return <CRMERPIntegration />
      case 'customers':
        return <Customers />
      case 'inventory':
        return <Inventory />
      case 'orders':
        return <Orders />
      case 'invoices':
        return <Invoices />
      case 'support':
        return <Support />
      case 'audit':
        return <AuditLog />
      case 'blockchain':
        return <Blockchain />
      case 'crm-analytics':
        return <CRMAnalytics />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-[200px]'}`}>
        {/* Top Bar */}
        <TopBar />

        {/* Page Content */}
        <main className="p-6 pt-[84px]">
          {renderPage()}
        </main>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  )
}
