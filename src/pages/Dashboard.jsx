import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import AnimatedNumber from '../components/UI/AnimatedNumber'
import Badge from '../components/UI/Badge'
import LineChart from '../components/Charts/LineChart'
import DonutChart from '../components/Charts/DonutChart'

const kpiIcons = {
  revenue: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  orders: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  customers: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  pending: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  leads: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
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
    { label: 'Shipped', value: orderStats.shipped, color: '#7c3aed' },
    { label: 'Processing', value: orderStats.processing, color: '#f39c12' },
    { label: 'Delivered', value: orderStats.delivered, color: '#2ecc71' },
    { label: 'Cancelled', value: orderStats.cancelled, color: '#e74c3c' },
    { label: 'Pending', value: orderStats.pending, color: '#adb5bd' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Welcome back, {user.name.split(' ')[0]}!</h1>
        <p className="text-text-secondary mt-1">
          Here's what's happening with your business · {currentTime.toLocaleTimeString()}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          label="Total Revenue"
          value={<AnimatedNumber value={metrics.totalRevenue} prefix="₹" />}
          icon={kpiIcons.revenue}
          iconBg="bg-green/10"
          iconColor="text-green"
          change={12.5}
        />
        <KPICard
          label="Total Orders"
          value={<AnimatedNumber value={metrics.totalOrders} />}
          icon={kpiIcons.orders}
          iconBg="bg-blue/10"
          iconColor="text-blue"
          change={8.2}
        />
        <KPICard
          label="Active Customers"
          value={<AnimatedNumber value={metrics.activeCustomers} />}
          icon={kpiIcons.customers}
          iconBg="bg-purple/10"
          iconColor="text-purple"
          change={-2.4}
        />
        <KPICard
          label="Pending Orders"
          value={<AnimatedNumber value={metrics.pendingOrders} />}
          icon={kpiIcons.pending}
          iconBg="bg-orange/10"
          iconColor="text-orange"
          change={5.1}
        />
        <KPICard
          label="Leads Pipeline"
          value={<AnimatedNumber value={metrics.leadsPipeline} />}
          icon={kpiIcons.leads}
          iconBg="bg-blue/10"
          iconColor="text-blue"
          change={15.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="mb-4">
            <h3 className="font-semibold text-text-primary">Revenue Over Time</h3>
            <p className="text-sm text-text-secondary">Last 12 months</p>
          </div>
          <LineChart data={revenueHistory} width={500} height={250} />
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="mb-4">
            <h3 className="font-semibold text-text-primary">Order Status</h3>
            <p className="text-sm text-text-secondary">Distribution by status</p>
          </div>
          <DonutChart segments={donutSegments} width={350} height={200} />
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-border">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-text-primary">Recent Orders</h3>
            <button 
              onClick={() => setActivePage('orders')}
              className="text-sm text-blue hover:underline"
            >
              View all →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-6 text-xs font-medium text-text-muted uppercase tracking-wide">Order ID</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-text-muted uppercase tracking-wide">Customer</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-text-muted uppercase tracking-wide">Amount</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-text-muted uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-6 text-sm font-medium text-text-primary">{order.id}</td>
                    <td className="py-3 px-6 text-sm text-text-secondary">{order.customer}</td>
                    <td className="py-3 px-6 text-sm text-text-primary">${order.amount.toLocaleString()}</td>
                    <td className="py-3 px-6"><Badge>{order.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl shadow-sm border border-border">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-text-primary">Recent Invoices</h3>
            <button 
              onClick={() => setActivePage('invoices')}
              className="text-sm text-blue hover:underline"
            >
              View all →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-6 text-xs font-medium text-text-muted uppercase tracking-wide">Invoice ID</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-text-muted uppercase tracking-wide">Customer</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-text-muted uppercase tracking-wide">Amount</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-text-muted uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 5).map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-6 text-sm font-medium text-text-primary">{invoice.id}</td>
                    <td className="py-3 px-6 text-sm text-text-secondary">{invoice.customer}</td>
                    <td className="py-3 px-6 text-sm text-text-primary">${invoice.amount.toLocaleString()}</td>
                    <td className="py-3 px-6"><Badge>{invoice.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-border">
          <p className="text-sm text-text-secondary">Pending Orders</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            <AnimatedNumber value={orderStats.pending} />
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-border">
          <p className="text-sm text-text-secondary">Delivered</p>
          <p className="text-2xl font-bold text-green mt-1">
            <AnimatedNumber value={orderStats.delivered} />
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-border">
          <p className="text-sm text-text-secondary">Paid Invoices</p>
          <p className="text-2xl font-bold text-green mt-1">
            <AnimatedNumber value={invoiceStats.paid} />
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-border">
          <p className="text-sm text-text-secondary">Verified Txns</p>
          <p className="text-2xl font-bold text-blue mt-1">
            <AnimatedNumber value={blockchainTxs.filter(t => t.status === 'Verified').length} />
          </p>
        </div>
      </div>

      {/* Blockchain Activity Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text-primary">Blockchain Activity</h3>
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green/10 text-green text-xs font-medium rounded-full">
              <span className="w-1.5 h-1.5 bg-green rounded-full animate-pulse" />
              Live
            </span>
          </div>
          <button 
            onClick={() => setActivePage('blockchain')}
            className="text-sm text-blue hover:underline"
          >
            View all {blockchainTxs.length} transactions
          </button>
        </div>
        <div className="divide-y divide-border">
          {blockchainTxs.slice(0, 8).map((tx, index) => (
            <div 
              key={tx.id} 
              className={`flex items-center gap-4 px-6 py-3 ${tx.isNew ? 'animate-slide-down bg-cyan-50' : ''}`}
            >
              <span className="text-green">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <Badge variant={tx.type}>{tx.type}</Badge>
              <span className="text-sm text-text-secondary">{tx.entityId}</span>
              <span className="text-sm font-mono text-blue truncate max-w-[120px]">
                {tx.hash.slice(0, 12)}...
              </span>
              <button 
                onClick={() => copyHash(tx.hash)} 
                className="p-1 text-text-muted hover:text-text-secondary transition-colors"
              >
                {copiedHash === tx.hash ? (
                  <span className="text-xs text-green">Copied!</span>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
              <Badge variant={tx.status} pulse={tx.status === 'Pending'}>{tx.status}</Badge>
              <span className="text-xs text-text-muted ml-auto">
                {new Date(tx.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KPICard({ label, value, icon, iconBg, iconColor, change }) {
  const isPositive = change >= 0
  
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
          <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green' : 'text-red'}`}>
            <svg className={`w-4 h-4 ${isPositive ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>{Math.abs(change)}%</span>
          </div>
        </div>
        <div className={`p-3 rounded-xl ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
