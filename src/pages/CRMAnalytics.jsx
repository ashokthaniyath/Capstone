import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { LineChart, DonutChart, BarChart } from '../components/Charts'
import AnimatedNumber from '../components/UI/AnimatedNumber'
import Badge from '../components/UI/Badge'

export default function CRMAnalytics() {
  const customers = useStore((state) => state.customers)
  const orders = useStore((state) => state.orders)
  const invoices = useStore((state) => state.invoices)
  const getCustomerStats = useStore((state) => state.getCustomerStats)
  const user = useStore((state) => state.user)
  const hasPermission = useStore((state) => state.hasPermission)

  const [timeRange, setTimeRange] = useState('30d')

  // RBAC check
  if (user.role === 'viewer' || !hasPermission('view_analytics')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary">Access Restricted</h2>
          <p className="text-text-secondary mt-2">You need Manager or Admin privileges to view CRM Analytics.</p>
        </div>
      </div>
    )
  }

  const customerStats = getCustomerStats()

  // Customer acquisition data
  const acquisitionData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const now = new Date()
    const currentMonth = now.getMonth()
    
    return months.slice(currentMonth - 5, currentMonth + 1).map((m, i) => ({
      label: m,
      value: Math.floor(Math.random() * 20 + 5 + i * 2)
    }))
  }, [])

  // Customer segments
  const segmentData = useMemo(() => {
    const segments = { enterprise: 0, business: 0, startup: 0, individual: 0 }
    customers.forEach(c => {
      segments[c.segment] = (segments[c.segment] || 0) + 1
    })
    return [
      { label: 'Enterprise', value: segments.enterprise, color: '#4361ee' },
      { label: 'Business', value: segments.business, color: '#2ecc71' },
      { label: 'Startup', value: segments.startup, color: '#f39c12' },
      { label: 'Individual', value: segments.individual, color: '#7c3aed' },
    ]
  }, [customers])

  // Customer lifetime value distribution
  const clvData = useMemo(() => {
    const ranges = [
      { label: '₹0-5K', min: 0, max: 5000, count: 0 },
      { label: '₹5-15K', min: 5000, max: 15000, count: 0 },
      { label: '₹15-30K', min: 15000, max: 30000, count: 0 },
      { label: '₹30-50K', min: 30000, max: 50000, count: 0 },
      { label: '₹50K+', min: 50000, max: Infinity, count: 0 },
    ]
    
    customers.forEach(c => {
      const range = ranges.find(r => c.lifetimeValue >= r.min && c.lifetimeValue < r.max)
      if (range) range.count++
    })
    
    return ranges.map(r => ({ label: r.label, value: r.count }))
  }, [customers])

  // Sales pipeline stages
  const pipelineData = useMemo(() => {
    return [
      { stage: 'Lead', count: 45, value: 225000, color: 'bg-gray-400' },
      { stage: 'Qualified', count: 32, value: 480000, color: 'bg-blue' },
      { stage: 'Proposal', count: 18, value: 350000, color: 'bg-orange' },
      { stage: 'Negotiation', count: 8, value: 200000, color: 'bg-purple' },
      { stage: 'Closed Won', count: 5, value: 175000, color: 'bg-green' },
    ]
  }, [])

  // Top customers by revenue
  const topCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => b.lifetimeValue - a.lifetimeValue)
      .slice(0, 5)
  }, [customers])

  // Recent customer activity
  const recentActivity = useMemo(() => {
    return [
      { customer: 'Acme Corp', action: 'New order placed', time: '2 min ago', type: 'order' },
      { customer: 'TechStart Inc', action: 'Invoice paid', time: '15 min ago', type: 'payment' },
      { customer: 'Global Systems', action: 'Support ticket opened', time: '1 hr ago', type: 'support' },
      { customer: 'DataFlow Ltd', action: 'Contract renewed', time: '3 hrs ago', type: 'contract' },
      { customer: 'CloudNine', action: 'Demo scheduled', time: '5 hrs ago', type: 'meeting' },
    ]
  }, [])

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">CRM Analytics</h1>
          <p className="text-text-secondary mt-1">Customer relationship insights and pipeline</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d', '1y'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range 
                  ? 'bg-blue text-white' 
                  : 'bg-white border border-border hover:bg-gray-50'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <p className="text-sm text-text-secondary">Total Customers</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            <AnimatedNumber value={customerStats.total} />
          </p>
          <p className="text-xs text-green mt-2">+12% from last month</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <p className="text-sm text-text-secondary">Active Customers</p>
          <p className="text-2xl font-bold text-green mt-1">
            <AnimatedNumber value={customerStats.active} />
          </p>
          <p className="text-xs text-text-muted mt-2">{Math.round(customerStats.active / customerStats.total * 100)}% of total</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <p className="text-sm text-text-secondary">Avg. Lifetime Value</p>
          <p className="text-2xl font-bold text-blue mt-1">
            ₹{Math.round(customerStats.avgLifetimeValue / 1000)}K
          </p>
          <p className="text-xs text-green mt-2">+8% from last month</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <p className="text-sm text-text-secondary">Total Revenue (LTV)</p>
          <p className="text-2xl font-bold text-purple mt-1">
            ₹{Math.round(customerStats.totalLifetimeValue / 1000000)}M
          </p>
          <p className="text-xs text-green mt-2">+15% YoY</p>
        </div>
      </div>

      {/* Sales Pipeline */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Sales Pipeline</h2>
        <div className="space-y-4">
          {pipelineData.map((stage, i) => {
            const maxValue = Math.max(...pipelineData.map(s => s.value))
            const widthPercent = (stage.value / maxValue) * 100
            return (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <span className="font-medium text-text-primary">{stage.stage}</span>
                    <span className="text-sm text-text-muted">({stage.count} deals)</span>
                  </div>
                  <span className="font-semibold text-text-primary">{formatCurrency(stage.value)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${stage.color} transition-all duration-700`}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
          <span className="text-text-muted">Total Pipeline Value</span>
          <span className="font-bold text-text-primary">
            {formatCurrency(pipelineData.reduce((sum, s) => sum + s.value, 0))}
          </span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Customer Acquisition</h2>
          <BarChart data={acquisitionData} height={250} color="#4361ee" />
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Customer Segments</h2>
          <DonutChart data={segmentData} size={220} />
        </div>
      </div>

      {/* CLV Distribution */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Customer Lifetime Value Distribution</h2>
        <BarChart data={clvData} height={200} color="#7c3aed" />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Top Customers by Revenue</h2>
          <div className="space-y-3">
            {topCustomers.map((customer, i) => (
              <div key={customer.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <span className="w-8 h-8 rounded-full bg-blue/10 text-blue flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{customer.name}</p>
                  <p className="text-sm text-text-muted">{customer.company}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-text-primary">{formatCurrency(customer.lifetimeValue)}</p>
                  <Badge variant={customer.status === 'active' ? 'success' : 'warning'}>{customer.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Customer Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-4 p-3 border-b border-border last:border-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activity.type === 'order' ? 'bg-blue/10 text-blue' :
                  activity.type === 'payment' ? 'bg-green/10 text-green' :
                  activity.type === 'support' ? 'bg-orange/10 text-orange' :
                  activity.type === 'contract' ? 'bg-purple/10 text-purple' :
                  'bg-gray-100 text-text-muted'
                }`}>
                  {activity.type === 'order' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  )}
                  {activity.type === 'payment' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {activity.type === 'support' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                  {activity.type === 'contract' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {activity.type === 'meeting' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{activity.customer}</p>
                  <p className="text-sm text-text-secondary">{activity.action}</p>
                </div>
                <span className="text-xs text-text-muted whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
