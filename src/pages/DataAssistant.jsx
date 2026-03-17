import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'

// Sample data for AI queries
const YEARLY_DATA = [
  { year: 2022, revenue: 1850000, orders: 2450, customers: 820, expenses: 1200000, profit: 650000 },
  { year: 2023, revenue: 2340000, orders: 3120, customers: 1050, expenses: 1450000, profit: 890000 },
  { year: 2024, revenue: 2890000, orders: 3850, customers: 1320, expenses: 1680000, profit: 1210000 },
  { year: 2025, revenue: 3450000, orders: 4580, customers: 1580, expenses: 1950000, profit: 1500000 },
  { year: 2026, revenue: 980000, orders: 1250, customers: 1650, expenses: 580000, profit: 400000 }
]

// AI Response processor
const processQuery = (query, storeData) => {
  const lowerQuery = query.toLowerCase()
  
  // Year-based queries
  if (lowerQuery.includes('year') || lowerQuery.includes('annual') || lowerQuery.includes('yearly')) {
    const yearMatch = lowerQuery.match(/20\d{2}/)
    if (yearMatch) {
      const year = parseInt(yearMatch[0])
      const yearData = YEARLY_DATA.find(d => d.year === year)
      if (yearData) {
        return {
          type: 'yearly',
          data: yearData,
          response: `📊 **${year} Annual Report**\n\n| Metric | Value |\n|--------|-------|\n| Revenue | ₹${yearData.revenue.toLocaleString()} |\n| Orders | ${yearData.orders} |\n| Customers | ${yearData.customers} |\n| Expenses | ₹${yearData.expenses.toLocaleString()} |\n| Profit | ₹${yearData.profit.toLocaleString()} |\n\n*Profit Margin: ${((yearData.profit / yearData.revenue) * 100).toFixed(1)}%*`
        }
      }
    }
    return {
      type: 'yearly-all',
      data: YEARLY_DATA,
      response: `📊 **Year-over-Year Performance**\n\n| Year | Revenue | Orders | Customers | Profit |\n|------|---------|--------|-----------|--------|\n${YEARLY_DATA.map(y => `| ${y.year} | ₹${(y.revenue / 1000000).toFixed(2)}M | ${y.orders} | ${y.customers} | ₹${(y.profit / 1000000).toFixed(2)}M |`).join('\n')}\n\n*2026 data is year-to-date through March.*`
    }
  }

  // Product queries
  if (lowerQuery.includes('product') || lowerQuery.includes('inventory') || lowerQuery.includes('stock') || lowerQuery.includes('best sell') || lowerQuery.includes('top sell')) {
    const topProducts = [...storeData.inventory].sort((a, b) => b.price * b.stock - a.price * a.stock).slice(0, 5)
    return {
      type: 'products',
      data: topProducts,
      response: `📦 **Product Performance**\n\n**Top Products by Value:**\n\n| Product | SKU | Price | Stock | Value |\n|---------|-----|-------|-------|-------|\n${topProducts.map(p => `| ${p.name} | ${p.sku} | ₹${p.price.toLocaleString()} | ${p.stock} | ₹${(p.price * p.stock).toLocaleString()} |`).join('\n')}\n\n**Inventory Status:**\n- In Stock: ${storeData.inventory.filter(p => p.status === 'In Stock').length}\n- Low Stock: ${storeData.inventory.filter(p => p.status === 'Low Stock').length}\n- Out of Stock: ${storeData.inventory.filter(p => p.status === 'Out of Stock').length}`
    }
  }

  // Revenue queries
  if (lowerQuery.includes('revenue') || lowerQuery.includes('sales') || lowerQuery.includes('income') || lowerQuery.includes('earning')) {
    const totalRevenue = YEARLY_DATA.reduce((sum, y) => sum + y.revenue, 0)
    return {
      type: 'revenue',
      data: YEARLY_DATA,
      response: `💰 **Revenue Analysis**\n\n**Lifetime Revenue:** ₹${totalRevenue.toLocaleString()}\n\n| Year | Revenue | YoY Growth |\n|------|---------|------------|\n${YEARLY_DATA.map((y, i) => {
        const prev = YEARLY_DATA[i - 1]
        const growth = prev ? (((y.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1) : 'N/A'
        return `| ${y.year} | ₹${(y.revenue / 1000000).toFixed(2)}M | ${growth === 'N/A' ? 'N/A' : growth + '%'} |`
      }).join('\n')}`
    }
  }

  // Order queries
  if (lowerQuery.includes('order') || lowerQuery.includes('purchase')) {
    const orderStats = {
      total: storeData.orders.length,
      shipped: storeData.orders.filter(o => o.status === 'Shipped').length,
      delivered: storeData.orders.filter(o => o.status === 'Delivered').length,
      processing: storeData.orders.filter(o => o.status === 'Processing').length,
      pending: storeData.orders.filter(o => o.status === 'Pending').length,
    }
    const totalValue = storeData.orders.reduce((sum, o) => sum + (o.amount || o.total || 0), 0)
    return {
      type: 'orders',
      data: orderStats,
      response: `📋 **Orders Overview**\n\n**Current Orders:** ${orderStats.total}\n**Total Value:** ₹${totalValue.toLocaleString()}\n\n| Status | Count | Percentage |\n|--------|-------|------------|\n| Delivered | ${orderStats.delivered} | ${((orderStats.delivered / orderStats.total) * 100).toFixed(1)}% |\n| Shipped | ${orderStats.shipped} | ${((orderStats.shipped / orderStats.total) * 100).toFixed(1)}% |\n| Processing | ${orderStats.processing} | ${((orderStats.processing / orderStats.total) * 100).toFixed(1)}% |\n| Pending | ${orderStats.pending} | ${((orderStats.pending / orderStats.total) * 100).toFixed(1)}% |`
    }
  }

  // Invoice queries
  if (lowerQuery.includes('invoice') || lowerQuery.includes('billing') || lowerQuery.includes('payment')) {
    const invoiceStats = {
      total: storeData.invoices.length,
      paid: storeData.invoices.filter(i => i.status === 'Paid').length,
      overdue: storeData.invoices.filter(i => i.status === 'Overdue').length,
    }
    const totalValue = storeData.invoices.reduce((sum, i) => sum + i.amount, 0)
    return {
      type: 'invoices',
      data: invoiceStats,
      response: `🧾 **Invoice Summary**\n\n**Total Invoices:** ${invoiceStats.total}\n**Total Value:** ₹${totalValue.toLocaleString()}\n\n| Status | Count |\n|--------|-------|\n| Paid | ${invoiceStats.paid} |\n| Overdue | ${invoiceStats.overdue} |`
    }
  }

  // Help / capabilities
  if (lowerQuery.includes('help') || lowerQuery.includes('what can') || lowerQuery.includes('capabilities')) {
    return {
      type: 'help',
      data: null,
      response: `🤖 **BlockERP Data Assistant**\n\nI can help you analyze your business data:\n\n**📊 Time-Based Analysis:**\n- Yearly data (2022-2026)\n- "Show 2024 annual report"\n\n**💼 Business Metrics:**\n- "Revenue analysis"\n- "Order statistics"\n- "Invoice summary"\n\n**📦 Operations:**\n- "Top selling products"\n- "Inventory status"`
    }
  }

  // Default response
  return {
    type: 'general',
    data: null,
    response: `I can help you analyze your ERP data. Try asking:\n\n- "Show 2024 annual report"\n- "Top selling products"\n- "Revenue trend analysis"\n- "Order statistics"\n- "Invoice summary"\n\nWhat would you like to know?`
  }
}

export default function DataAssistant() {
  const inventory = useStore((state) => state.inventory)
  const orders = useStore((state) => state.orders)
  const invoices = useStore((state) => state.invoices)
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: `👋 **Welcome to BlockERP AI Assistant!**\n\nI can help you extract and analyze your ERP data:\n\n- 📊 Historical data (2022-2026)\n- 💰 Revenue analysis\n- 📦 Product performance\n- 📋 Order & invoice stats\n\n**Try asking:** "Show me 2025 yearly report" or "Top selling products"`,
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))

    const storeData = { inventory, orders, invoices }
    const response = processQuery(userMessage.content, storeData)

    const assistantMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: response.response,
      data: response.data,
      type: response.type,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, assistantMessage])
    setIsTyping(false)
  }

  const quickActions = [
    { label: '2025 Report', query: 'Show 2025 annual report' },
    { label: 'Top Products', query: 'Top selling products' },
    { label: 'Revenue Trend', query: 'Revenue analysis all years' },
    { label: 'Orders', query: 'Order statistics' },
  ]

  const formatMessage = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', height: '100%' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ 
            width: 40, height: 40, 
            background: 'linear-gradient(135deg, var(--erp-primary), var(--erp-purple))', 
            borderRadius: 'var(--radius-large)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 0 }}>AI Data Assistant</h1>
            <p className="page-subtitle">AI-powered analytics for your ERP data</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-8)', color: 'var(--muted-foreground)' }}>
          <span style={{ width: 8, height: 8, background: 'var(--erp-success)', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
          AI Connected
        </div>
      </header>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {quickActions.map((action, i) => (
          <button 
            key={i}
            data-variant="secondary"
            className="small"
            onClick={() => setInputValue(action.query)}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Chat Interface */}
      <div className="chat-container" style={{ flex: 1 }}>
        {/* Messages */}
        <div className="chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chat-message ${message.role}`}
            >
              {message.role === 'assistant' ? (
                <div dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
              ) : (
                <p>{message.content}</p>
              )}
              <div style={{ fontSize: 'var(--text-8)', opacity: 0.7, marginTop: 'var(--space-1)' }}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="chat-message assistant">
              <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                <span style={{ width: 8, height: 8, background: 'var(--muted-foreground)', borderRadius: '50%', animation: 'bounce 1s infinite 0ms' }} />
                <span style={{ width: 8, height: 8, background: 'var(--muted-foreground)', borderRadius: '50%', animation: 'bounce 1s infinite 150ms' }} />
                <span style={{ width: 8, height: 8, background: 'var(--muted-foreground)', borderRadius: '50%', animation: 'bounce 1s infinite 300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form className="chat-input-container" onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your business data..."
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={!inputValue.trim()}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send
          </button>
        </form>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
