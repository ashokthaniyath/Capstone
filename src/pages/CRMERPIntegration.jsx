import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import AnimatedNumber from '../components/UI/AnimatedNumber'
import Badge from '../components/UI/Badge'
import LineChart from '../components/Charts/LineChart'
import DonutChart from '../components/Charts/DonutChart'
import BarChart from '../components/Charts/BarChart'

export default function CRMERPIntegration() {
  const customers = useStore((state) => state.customers)
  const orders = useStore((state) => state.orders)
  const invoices = useStore((state) => state.invoices)
  const inventory = useStore((state) => state.inventory)
  const user = useStore((state) => state.user)
  const hasPermission = useStore((state) => state.hasPermission)
  const revenueHistory = useStore((state) => state.revenueHistory)

  const [selectedView, setSelectedView] = useState('overview')

  // RBAC check
  if (user.role === 'viewer' || !hasPermission('view_all')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary">Access Restricted</h2>
          <p className="text-text-secondary mt-2">You need Manager or Admin privileges to view CRM-ERP Integration.</p>
        </div>
      </div>
    )
  }

  // CRM-ERP Integration Metrics
  const integrationMetrics = useMemo(() => {
    // Customer to Order mapping
    const customerOrders = customers.map(c => {
      const customerOrderList = orders.filter(o => o.customer === c.name)
      const customerInvoices = invoices.filter(i => i.customer === c.name)
      return {
        ...c,
        orderCount: customerOrderList.length,
        orderValue: customerOrderList.reduce((sum, o) => sum + o.amount, 0),
        invoiceCount: customerInvoices.length,
        invoiceValue: customerInvoices.reduce((sum, i) => sum + i.amount, 0),
        paidInvoices: customerInvoices.filter(i => i.status === 'Paid').length,
        overdueInvoices: customerInvoices.filter(i => i.status === 'Overdue').length,
      }
    })

    // Top customers by revenue
    const topCustomers = [...customerOrders]
      .sort((a, b) => b.orderValue - a.orderValue)
      .slice(0, 5)

    // Customers with overdue invoices
    const atRiskCustomers = customerOrders.filter(c => c.overdueInvoices > 0)

    // Product popularity from orders
    const productSales = {}
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          if (!productSales[item.name]) {
            productSales[item.name] = { quantity: 0, revenue: 0 }
          }
          productSales[item.name].quantity += item.quantity || 1
          productSales[item.name].revenue += item.total || item.price || 0
        })
      }
    })

    return {
      customerOrders,
      topCustomers,
      atRiskCustomers,
      productSales,
      totalLinkedOrders: orders.filter(o => customers.some(c => c.name === o.customer)).length,
      totalUnlinkedOrders: orders.filter(o => !customers.some(c => c.name === o.customer)).length,
    }
  }, [customers, orders, invoices])

  // Revenue by customer segment
  const segmentData = useMemo(() => {
    const segments = { Enterprise: 0, SMB: 0, Startup: 0, Other: 0 }
    customers.forEach(c => {
      const customerOrders = orders.filter(o => o.customer === c.name)
      const value = customerOrders.reduce((sum, o) => sum + o.amount, 0)
      if (c.company?.includes('Corp') || c.company?.includes('Inc') || value > 50000) {
        segments.Enterprise += value
      } else if (c.company?.includes('LLC') || value > 20000) {
        segments.SMB += value
      } else if (c.company?.includes('Startup') || value < 10000) {
        segments.Startup += value
      } else {
        segments.Other += value
      }
    })
    return Object.entries(segments).map(([label, value]) => ({ label, value }))
  }, [customers, orders])

  const donutColors = ['#7c3aed', '#4361ee', '#2ecc71', '#f39c12']

  // Order fulfillment by customer tier
  const fulfillmentData = [
    { label: 'Enterprise', value: 95, color: '#7c3aed' },
    { label: 'SMB', value: 88, color: '#4361ee' },
    { label: 'Startup', value: 82, color: '#2ecc71' },
    { label: 'Others', value: 79, color: '#f39c12' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">CRM-ERP Integration</h1>
          <p className="text-text-secondary mt-1">Unified view of customer relationships and operations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedView('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'overview' 
                ? 'bg-blue text-white' 
                : 'bg-white text-text-secondary hover:bg-gray-50 border border-border'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedView('customers')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'customers' 
                ? 'bg-blue text-white' 
                : 'bg-white text-text-secondary hover:bg-gray-50 border border-border'
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => setSelectedView('sync')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'sync' 
                ? 'bg-blue text-white' 
                : 'bg-white text-text-secondary hover:bg-gray-50 border border-border'
            }`}
          >
            Sync Status
          </button>
        </div>
      </div>

      {/* Integration Status Banner */}
      <div className="bg-gradient-to-r from-blue/10 to-purple/10 rounded-xl p-4 border border-blue/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-text-primary">Integration Active</p>
              <p className="text-sm text-text-secondary">CRM and ERP data synced • Last sync: 2 minutes ago</p>
            </div>
          </div>
          <Badge variant="success">Healthy</Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Linked Customers</p>
            <div className="w-8 h-8 rounded-lg bg-blue/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary mt-2">
            <AnimatedNumber value={customers.length} />
          </p>
          <p className="text-xs text-green mt-1">100% synced</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Linked Orders</p>
            <div className="w-8 h-8 rounded-lg bg-purple/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary mt-2">
            <AnimatedNumber value={integrationMetrics.totalLinkedOrders} />
          </p>
          <p className="text-xs text-text-muted mt-1">{integrationMetrics.totalUnlinkedOrders} unlinked</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">At-Risk Accounts</p>
            <div className="w-8 h-8 rounded-lg bg-red/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-red mt-2">
            <AnimatedNumber value={integrationMetrics.atRiskCustomers.length} />
          </p>
          <p className="text-xs text-text-muted mt-1">Overdue invoices</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Data Sync Rate</p>
            <div className="w-8 h-8 rounded-lg bg-green/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-green mt-2">99.8%</p>
          <p className="text-xs text-text-muted mt-1">Real-time sync</p>
        </div>
      </div>

      {selectedView === 'overview' && (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Segment */}
            <div className="bg-white rounded-xl shadow-sm border border-border p-6">
              <h3 className="font-semibold text-text-primary mb-4">Revenue by Customer Segment</h3>
              <DonutChart data={segmentData} colors={donutColors} />
            </div>

            {/* Fulfillment Rate */}
            <div className="bg-white rounded-xl shadow-sm border border-border p-6">
              <h3 className="font-semibold text-text-primary mb-4">Order Fulfillment by Tier</h3>
              <BarChart data={fulfillmentData} />
            </div>
          </div>

          {/* Revenue Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="font-semibold text-text-primary mb-4">Integrated Revenue Trend</h3>
            <LineChart data={revenueHistory} />
          </div>
        </>
      )}

      {selectedView === 'customers' && (
        <>
          {/* Top Customers Table */}
          <div className="bg-white rounded-xl shadow-sm border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-text-primary">Top Customers by Revenue</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Company</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase">Orders</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase">Revenue</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase">Invoices</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-text-secondary uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {integrationMetrics.topCustomers.map((customer, index) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue/10 flex items-center justify-center text-blue font-medium text-sm">
                            {customer.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{customer.name}</p>
                            <p className="text-xs text-text-secondary">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{customer.company}</td>
                      <td className="px-6 py-4 text-sm text-text-primary text-right">{customer.orderCount}</td>
                      <td className="px-6 py-4 text-sm font-medium text-text-primary text-right">
                        ₹{customer.orderValue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-primary text-right">
                        {customer.invoiceCount} ({customer.paidInvoices} paid)
                      </td>
                      <td className="px-6 py-4 text-center">
                        {customer.overdueInvoices > 0 ? (
                          <Badge variant="error">At Risk</Badge>
                        ) : (
                          <Badge variant="success">Healthy</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* At-Risk Customers */}
          {integrationMetrics.atRiskCustomers.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-red/20">
              <div className="px-6 py-4 border-b border-red/20 bg-red/5">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="font-semibold text-red">Customers with Overdue Invoices</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {integrationMetrics.atRiskCustomers.map(customer => (
                    <div key={customer.id} className="p-4 bg-red/5 rounded-lg border border-red/10">
                      <p className="font-medium text-text-primary">{customer.name}</p>
                      <p className="text-sm text-text-secondary">{customer.company}</p>
                      <p className="text-sm text-red mt-2">{customer.overdueInvoices} overdue invoice(s)</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {selectedView === 'sync' && (
        <>
          {/* Sync Status */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="font-semibold text-text-primary mb-4">Data Sync Status</h3>
            <div className="space-y-4">
              {[
                { module: 'Customers', records: customers.length, status: 'synced', lastSync: '2 min ago' },
                { module: 'Orders', records: orders.length, status: 'synced', lastSync: '2 min ago' },
                { module: 'Invoices', records: invoices.length, status: 'synced', lastSync: '2 min ago' },
                { module: 'Inventory', records: inventory.length, status: 'synced', lastSync: '5 min ago' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${item.status === 'synced' ? 'bg-green' : 'bg-yellow'}`} />
                    <div>
                      <p className="font-medium text-text-primary">{item.module}</p>
                      <p className="text-sm text-text-secondary">{item.records} records</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={item.status === 'synced' ? 'success' : 'warning'}>
                      {item.status === 'synced' ? 'Synced' : 'Syncing'}
                    </Badge>
                    <p className="text-xs text-text-muted mt-1">{item.lastSync}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Integration Endpoints */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="font-semibold text-text-primary mb-4">Integration Endpoints</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green" />
                  <p className="font-medium text-text-primary">CRM API</p>
                </div>
                <p className="text-sm text-text-secondary">https://api.blockerp.io/crm/v2</p>
                <p className="text-xs text-green mt-2">Response time: 45ms</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green" />
                  <p className="font-medium text-text-primary">ERP API</p>
                </div>
                <p className="text-sm text-text-secondary">https://api.blockerp.io/erp/v2</p>
                <p className="text-xs text-green mt-2">Response time: 38ms</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green" />
                  <p className="font-medium text-text-primary">Blockchain Node</p>
                </div>
                <p className="text-sm text-text-secondary">wss://node.blockerp.io/ws</p>
                <p className="text-xs text-green mt-2">Latency: 12ms</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green" />
                  <p className="font-medium text-text-primary">Analytics Engine</p>
                </div>
                <p className="text-sm text-text-secondary">https://analytics.blockerp.io/v1</p>
                <p className="text-xs text-green mt-2">Response time: 120ms</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
