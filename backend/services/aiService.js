/**
 * AI Service
 * Provides AI-assisted automation for ERP operations
 * Simple rule-based + pattern matching (no external AI API required)
 */

class AIService {
  constructor() {
    // Thresholds and configuration
    this.config = {
      lowStockThreshold: 10,
      criticalStockThreshold: 5,
      reorderMultiplier: 1.5, // Reorder 1.5x the threshold
      slowMovingDays: 30, // Days without sale = slow moving
      vendorRiskThreshold: 40 // Trust score below this = risky
    };
  }

  /**
   * Analyze inventory and suggest reorders
   * @param {Array} inventoryData - Array of product objects
   * @returns {Object} Reorder suggestions and insights
   */
  suggestReorder(inventoryData) {
    if (!inventoryData || !Array.isArray(inventoryData)) {
      return {
        success: false,
        error: 'Invalid inventory data provided'
      };
    }

    const suggestions = [];
    const insights = {
      totalProducts: inventoryData.length,
      lowStockCount: 0,
      criticalStockCount: 0,
      outOfStockCount: 0,
      healthyStockCount: 0,
      estimatedReorderValue: 0
    };

    inventoryData.forEach(product => {
      const quantity = product.quantity || 0;
      const threshold = product.reorderThreshold || this.config.lowStockThreshold;
      const price = product.costPrice || product.price || 0;

      // Categorize stock level
      if (quantity === 0) {
        insights.outOfStockCount++;
        suggestions.push({
          product: product.name,
          sku: product.sku,
          barcode: product.barcode,
          currentStock: quantity,
          threshold: threshold,
          priority: 'CRITICAL',
          action: 'IMMEDIATE_REORDER',
          suggestedQuantity: Math.ceil(threshold * this.config.reorderMultiplier * 2),
          estimatedCost: Math.ceil(threshold * this.config.reorderMultiplier * 2 * price),
          reason: `Product is OUT OF STOCK. Immediate action required.`,
          icon: '🚨'
        });
      } else if (quantity <= this.config.criticalStockThreshold) {
        insights.criticalStockCount++;
        suggestions.push({
          product: product.name,
          sku: product.sku,
          barcode: product.barcode,
          currentStock: quantity,
          threshold: threshold,
          priority: 'HIGH',
          action: 'URGENT_REORDER',
          suggestedQuantity: Math.ceil(threshold * this.config.reorderMultiplier),
          estimatedCost: Math.ceil(threshold * this.config.reorderMultiplier * price),
          reason: `Stock critically low (${quantity} units). Reorder within 24 hours.`,
          icon: '⚠️'
        });
      } else if (quantity <= threshold) {
        insights.lowStockCount++;
        suggestions.push({
          product: product.name,
          sku: product.sku,
          barcode: product.barcode,
          currentStock: quantity,
          threshold: threshold,
          priority: 'MEDIUM',
          action: 'REORDER_SOON',
          suggestedQuantity: Math.ceil(threshold * this.config.reorderMultiplier),
          estimatedCost: Math.ceil(threshold * this.config.reorderMultiplier * price),
          reason: `Stock below threshold (${quantity}/${threshold}). Schedule reorder.`,
          icon: '📦'
        });
      } else {
        insights.healthyStockCount++;
      }
    });

    // Calculate total estimated reorder value
    insights.estimatedReorderValue = suggestions.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);

    // Sort by priority
    const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Generate summary
    const summary = this.generateReorderSummary(insights, suggestions);

    return {
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      insights,
      suggestions,
      actionRequired: suggestions.length > 0
    };
  }

  /**
   * Generate human-readable summary
   */
  generateReorderSummary(insights, suggestions) {
    const parts = [];

    if (insights.outOfStockCount > 0) {
      parts.push(`🚨 ${insights.outOfStockCount} product(s) are OUT OF STOCK and need immediate attention.`);
    }

    if (insights.criticalStockCount > 0) {
      parts.push(`⚠️ ${insights.criticalStockCount} product(s) have critically low stock.`);
    }

    if (insights.lowStockCount > 0) {
      parts.push(`📦 ${insights.lowStockCount} product(s) are below reorder threshold.`);
    }

    if (suggestions.length === 0) {
      parts.push(`✅ All products have healthy stock levels. No immediate action required.`);
    } else {
      parts.push(`💰 Estimated total reorder cost: $${insights.estimatedReorderValue.toLocaleString()}`);
    }

    return parts.join('\n');
  }

  /**
   * Explain a blockchain transaction
   * @param {string} orderId - Order ID to explain
   * @param {Object} orderData - Order data from database/blockchain
   * @returns {Object} Human-readable explanation
   */
  explainTransaction(orderId, orderData) {
    if (!orderData) {
      return {
        success: false,
        error: `Order ${orderId} not found`
      };
    }

    const statusExplanations = {
      'Created': {
        icon: '📝',
        title: 'Order Created',
        description: 'The purchase order has been created and funds are held in escrow on the blockchain.',
        nextSteps: ['Await delivery from supplier', 'Confirm delivery once received']
      },
      'Delivered': {
        icon: '📦',
        title: 'Delivery Confirmed',
        description: 'The buyer has confirmed receipt of the goods. Payment can now be released.',
        nextSteps: ['Review delivered items', 'Release payment to supplier']
      },
      'Paid': {
        icon: '✅',
        title: 'Payment Released',
        description: 'Payment has been released from escrow to the supplier. Transaction complete.',
        nextSteps: ['Transaction complete', 'Generate invoice if needed']
      },
      'Cancelled': {
        icon: '❌',
        title: 'Order Cancelled',
        description: 'The order was cancelled and escrow funds returned to the buyer.',
        nextSteps: ['Create new order if needed', 'Review cancellation reason']
      }
    };

    const status = orderData.status || orderData.blockchainStatus || 'Unknown';
    const explanation = statusExplanations[status] || {
      icon: '❓',
      title: 'Unknown Status',
      description: `Order is in "${status}" status.`,
      nextSteps: ['Check order details', 'Contact support if needed']
    };

    // Build timeline
    const timeline = [];
    
    if (orderData.createdAt) {
      timeline.push({
        event: 'Order Created',
        timestamp: orderData.createdAt,
        description: `Order ${orderId} created with amount ${this.formatAmount(orderData.amount || orderData.total)}`
      });
    }

    if (orderData.deliveredAt || orderData.deliveryConfirmedAt) {
      timeline.push({
        event: 'Delivery Confirmed',
        timestamp: orderData.deliveredAt || orderData.deliveryConfirmedAt,
        description: 'Buyer confirmed receipt of goods'
      });
    }

    if (orderData.paidAt || orderData.paymentReleasedAt) {
      timeline.push({
        event: 'Payment Released',
        timestamp: orderData.paidAt || orderData.paymentReleasedAt,
        description: 'Escrow funds released to supplier'
      });
    }

    return {
      success: true,
      orderId,
      status,
      explanation: {
        ...explanation,
        fullDescription: this.generateTransactionNarrative(orderData, status)
      },
      timeline,
      blockchainDetails: {
        txHash: orderData.blockchainTxHash || 'N/A',
        buyer: orderData.buyer?.address || orderData.buyer || 'N/A',
        supplier: orderData.supplierDetails?.address || orderData.supplier || 'N/A',
        amount: this.formatAmount(orderData.amount || orderData.total),
        escrowAmount: orderData.escrowAmount || 'N/A'
      }
    };
  }

  /**
   * Generate narrative explanation
   */
  generateTransactionNarrative(order, status) {
    const amount = this.formatAmount(order.amount || order.total);
    const orderId = order.orderId || order._id;

    switch (status) {
      case 'Created':
        return `Purchase order ${orderId} was created for ${amount}. ` +
               `The funds are currently held in a smart contract escrow. ` +
               `Once the supplier delivers the goods and the buyer confirms receipt, ` +
               `the payment will be released automatically.`;
      
      case 'Delivered':
        return `Delivery for order ${orderId} has been confirmed by the buyer. ` +
               `The goods have been received as expected. ` +
               `The escrow smart contract is now ready to release ${amount} to the supplier ` +
               `upon payment authorization.`;
      
      case 'Paid':
        return `Order ${orderId} has been fully completed. ` +
               `Payment of ${amount} was released from escrow to the supplier. ` +
               `This transaction is now immutably recorded on the blockchain ` +
               `and the supplier's trust score has been updated.`;
      
      case 'Cancelled':
        return `Order ${orderId} was cancelled before delivery confirmation. ` +
               `The escrow amount of ${amount} has been returned to the buyer. ` +
               `No funds were transferred to the supplier.`;
      
      default:
        return `Order ${orderId} is currently in "${status}" status with amount ${amount}.`;
    }
  }

  /**
   * Analyze vendor risk
   * @param {Object} vendor - Vendor data with trust metrics
   */
  analyzeVendorRisk(vendor) {
    if (!vendor) {
      return { success: false, error: 'Vendor data required' };
    }

    const trustScore = vendor.trustScore || 50;
    const metrics = vendor.trustMetrics || {};

    let riskLevel, recommendation, details;

    if (trustScore >= 80) {
      riskLevel = 'LOW';
      recommendation = 'This vendor is highly reliable. Safe for large orders.';
      details = '✅ Excellent track record with consistent delivery and quality.';
    } else if (trustScore >= 60) {
      riskLevel = 'MEDIUM';
      recommendation = 'This vendor is generally reliable but monitor orders closely.';
      details = '⚠️ Some minor issues in history. Standard precautions recommended.';
    } else if (trustScore >= 40) {
      riskLevel = 'HIGH';
      recommendation = 'Proceed with caution. Use blockchain escrow for all orders.';
      details = '🔶 Multiple delivery or quality issues recorded. Extra verification needed.';
    } else {
      riskLevel = 'CRITICAL';
      recommendation = 'Not recommended. Consider alternative vendors.';
      details = '🚨 Poor performance history. High risk of delays or issues.';
    }

    return {
      success: true,
      vendor: vendor.name || vendor.vendorId,
      trustScore,
      riskLevel,
      recommendation,
      details,
      metrics: {
        totalOrders: metrics.totalOrders || 0,
        successRate: metrics.totalOrders > 0 
          ? Math.round((metrics.successfulOrders / metrics.totalOrders) * 100) 
          : 0,
        delayRate: metrics.totalOrders > 0 
          ? Math.round((metrics.deliveryDelays / metrics.totalOrders) * 100) 
          : 0,
        avgDeliveryDays: metrics.averageDeliveryDays || 0
      }
    };
  }

  /**
   * Predict optimal reorder date
   * @param {Object} product - Product with sales history
   */
  predictReorderDate(product) {
    const quantity = product.quantity || 0;
    const threshold = product.reorderThreshold || 10;
    
    // Estimate daily sales (simplified - in real scenario, use historical data)
    const estimatedDailySales = 2; // Default estimate
    
    const daysUntilThreshold = Math.max(0, Math.floor((quantity - threshold) / estimatedDailySales));
    
    const reorderDate = new Date();
    reorderDate.setDate(reorderDate.getDate() + daysUntilThreshold);

    return {
      product: product.name,
      currentStock: quantity,
      threshold,
      estimatedDailySales,
      daysUntilReorder: daysUntilThreshold,
      recommendedReorderDate: reorderDate,
      urgency: daysUntilThreshold <= 3 ? 'HIGH' : daysUntilThreshold <= 7 ? 'MEDIUM' : 'LOW'
    };
  }

  /**
   * Format amount for display
   */
  formatAmount(amount) {
    if (!amount) return '$0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Get AI status
   */
  getStatus() {
    return {
      service: 'AIService',
      status: 'active',
      version: '1.0.0',
      capabilities: [
        'suggestReorder',
        'explainTransaction',
        'analyzeVendorRisk',
        'predictReorderDate'
      ],
      config: this.config
    };
  }
}

// Export singleton instance
module.exports = new AIService();
