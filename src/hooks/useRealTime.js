import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { generateAuditEntry, generateBlockchainTx } from '../data/seed'

export function useRealTime() {
  const updateMetrics = useStore((state) => state.updateMetrics)
  const appendBlockchainTx = useStore((state) => state.appendBlockchainTx)
  const appendAuditEntry = useStore((state) => state.appendAuditEntry)
  const tickets = useStore((state) => state.tickets)
  const updateTicketStatus = useStore((state) => state.updateTicketStatus)
  const inventory = useStore((state) => state.inventory)
  const updateStockLevel = useStore((state) => state.updateStockLevel)
  const addToast = useStore((state) => state.addToast)
  const incrementNotifications = useStore((state) => state.incrementNotifications)
  
  const blockchainCountRef = useRef(0)

  useEffect(() => {
    // 1. DASHBOARD METRICS — tick every 8 seconds
    const metricsTimer = setInterval(() => {
      updateMetrics()
    }, 8000)

    // 2. BLOCKCHAIN ACTIVITY FEED — new transaction every 6 seconds
    const blockchainTimer = setInterval(() => {
      const tx = generateBlockchainTx()
      appendBlockchainTx(tx)
      blockchainCountRef.current += 1
      
      // Show toast every 3rd transaction
      if (blockchainCountRef.current % 3 === 0) {
        addToast('⛓ New blockchain transaction verified', 'info')
        incrementNotifications()
      }
    }, 6000)

    // 3. AUDIT LOG — new entry appended every 12 seconds
    const auditTimer = setInterval(() => {
      const entry = generateAuditEntry()
      appendAuditEntry(entry)
    }, 12000)

    // 4. SUPPORT TICKET STATUS CHANGES — every 15 seconds
    const ticketTimer = setInterval(() => {
      const state = useStore.getState()
      const activeTickets = state.tickets.filter(t => t.status === 'open' || t.status === 'in-progress')
      if (activeTickets.length > 0) {
        const ticket = activeTickets[Math.floor(Math.random() * activeTickets.length)]
        const next = ticket.status === 'open' ? 'in-progress' : 'resolved'
        state.updateTicketStatus(ticket.id, next)
        state.addToast(`🎫 Ticket ${ticket.id} updated to ${next}`, 'success')
      }
    }, 15000)

    // 5. INVENTORY STOCK DEPLETION — every 20 seconds
    const inventoryTimer = setInterval(() => {
      const state = useStore.getState()
      const inStock = state.inventory.filter(p => p.stock > 0)
      if (inStock.length > 0) {
        const product = inStock[Math.floor(Math.random() * inStock.length)]
        const delta = -(Math.floor(Math.random() * 5) + 1)
        const newStock = product.stock + delta
        
        state.updateStockLevel(product.id, delta)
        
        if (newStock <= product.reorderLevel && product.status === 'In Stock') {
          state.addToast(`⚠ ${product.name} is now Low Stock (${Math.max(0, newStock)} units)`, 'warning')
        }
        if (newStock <= 0) {
          state.addToast(`🚨 ${product.name} is OUT OF STOCK`, 'error')
        }
      }
    }, 20000)

    // 6. CHART DATA REFRESH — every 30 seconds
    const chartTimer = setInterval(() => {
      updateMetrics()
    }, 30000)

    // 7. REVENUE TICKER — every 3 seconds (subtle)
    const revenueTimer = setInterval(() => {
      updateMetrics({ revenueOnly: true, delta: Math.floor(Math.random() * 1600) + 200 })
    }, 3000)

    return () => {
      clearInterval(metricsTimer)
      clearInterval(blockchainTimer)
      clearInterval(auditTimer)
      clearInterval(ticketTimer)
      clearInterval(inventoryTimer)
      clearInterval(chartTimer)
      clearInterval(revenueTimer)
    }
  }, [])
}
