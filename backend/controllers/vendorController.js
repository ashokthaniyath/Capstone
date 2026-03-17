/**
 * Vendor Controller
 * Handles vendor/supplier management with trust scores
 */

const { Vendor } = require('../models');
const blockchainService = require('../services/blockchainService');
const aiService = require('../services/aiService');

/**
 * Get vendor trust score
 * GET /api/vendor/trust-score/:id
 */
exports.getTrustScore = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find by vendor ID, MongoDB ID, or wallet address
    let vendor = await Vendor.findOne({ vendorId: id });
    
    if (!vendor) {
      vendor = await Vendor.findById(id).catch(() => null);
    }
    
    if (!vendor) {
      vendor = await Vendor.findOne({ walletAddress: id });
    }
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    // Get blockchain trust score if wallet address exists
    let blockchainScore = null;
    if (vendor.walletAddress && blockchainService.isInitialized) {
      try {
        blockchainScore = await blockchainService.getVendorTrustScore(vendor.walletAddress);
      } catch (e) {
        console.log('Could not fetch blockchain trust score:', e.message);
      }
    }
    
    // Get AI risk analysis
    const riskAnalysis = aiService.analyzeVendorRisk(vendor.toObject());
    
    // Combine database and blockchain metrics
    const combinedScore = blockchainScore 
      ? Math.round((vendor.trustScore + blockchainScore.trustScore) / 2)
      : vendor.trustScore;
    
    res.json({
      success: true,
      data: {
        vendor: {
          id: vendor.vendorId,
          name: vendor.name,
          company: vendor.company,
          walletAddress: vendor.walletAddress
        },
        trustScore: {
          overall: combinedScore,
          database: vendor.trustScore,
          blockchain: blockchainScore?.trustScore || null
        },
        metrics: {
          ...vendor.trustMetrics,
          blockchain: blockchainScore?.stats || null
        },
        riskAnalysis,
        rating: vendor.rating,
        reviewCount: vendor.reviewCount,
        status: vendor.status
      }
    });
  } catch (error) {
    console.error('Get trust score error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create vendor
 * POST /api/vendor/create
 */
exports.createVendor = async (req, res) => {
  try {
    const {
      name,
      company,
      email,
      phone,
      walletAddress,
      address,
      gstin,
      categories,
      paymentTerms,
      bankDetails
    } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }
    
    // Check for duplicate email
    const existing = await Vendor.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Vendor with this email already exists'
      });
    }
    
    const vendor = new Vendor({
      name,
      company,
      email: email.toLowerCase(),
      phone,
      walletAddress,
      address,
      gstin,
      categories: categories || [],
      paymentTerms: paymentTerms || 'net30',
      bankDetails,
      trustScore: 50, // Default starting score
      trustMetrics: {
        totalOrders: 0,
        successfulOrders: 0,
        deliveryDelays: 0,
        qualityIssues: 0,
        averageDeliveryDays: 0,
        contractExecutions: 0,
        failedContracts: 0
      }
    });
    
    await vendor.save();
    
    res.status(201).json({
      success: true,
      message: 'Vendor created successfully',
      data: { vendor }
    });
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all vendors
 * GET /api/vendors
 */
exports.getVendors = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, minTrustScore, category } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (minTrustScore) query.trustScore = { $gte: parseInt(minTrustScore) };
    if (category) query.categories = category;
    
    const vendors = await Vendor.find(query)
      .sort({ trustScore: -1, name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Vendor.countDocuments(query);
    
    // Add risk analysis for each vendor
    const vendorsWithRisk = vendors.map(v => ({
      ...v.toObject(),
      riskAnalysis: aiService.analyzeVendorRisk(v.toObject())
    }));
    
    res.json({
      success: true,
      data: {
        vendors: vendorsWithRisk,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get vendor by ID
 * GET /api/vendor/:id
 */
exports.getVendor = async (req, res) => {
  try {
    const { id } = req.params;
    
    let vendor = await Vendor.findOne({ vendorId: id });
    if (!vendor) {
      vendor = await Vendor.findById(id).catch(() => null);
    }
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        vendor,
        riskAnalysis: aiService.analyzeVendorRisk(vendor.toObject())
      }
    });
  } catch (error) {
    console.error('Get vendor error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update vendor
 * PUT /api/vendor/:id
 */
exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Prevent updating certain fields directly
    delete updates.vendorId;
    delete updates.trustScore;
    delete updates.trustMetrics;
    
    let vendor = await Vendor.findOne({ vendorId: id });
    if (!vendor) {
      vendor = await Vendor.findById(id).catch(() => null);
    }
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    Object.assign(vendor, updates);
    await vendor.save();
    
    res.json({
      success: true,
      message: 'Vendor updated successfully',
      data: { vendor }
    });
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Record order completion for trust score
 * POST /api/vendor/:id/record-order
 */
exports.recordOrderCompletion = async (req, res) => {
  try {
    const { id } = req.params;
    const { isSuccessful, daysToDeliver, hadQualityIssue, blockchainExecuted } = req.body;
    
    let vendor = await Vendor.findOne({ vendorId: id });
    if (!vendor) {
      vendor = await Vendor.findById(id).catch(() => null);
    }
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    await vendor.recordOrderCompletion(
      isSuccessful !== false,
      daysToDeliver || 5,
      hadQualityIssue || false,
      blockchainExecuted || false
    );
    
    res.json({
      success: true,
      message: 'Order recorded and trust score updated',
      data: {
        vendor,
        newTrustScore: vendor.trustScore,
        riskAnalysis: aiService.analyzeVendorRisk(vendor.toObject())
      }
    });
    
    // Emit real-time event via Socket.io
    req.app.get('io')?.emit('vendor:trust-updated', {
      vendorId: vendor.vendorId || vendor._id,
      name: vendor.name,
      trustScore: vendor.trustScore
    });
  } catch (error) {
    console.error('Record order error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get vendor leaderboard by trust score
 * GET /api/vendors/leaderboard
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const vendors = await Vendor.getByTrustScore(0);
    const topVendors = vendors.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        leaderboard: topVendors.map((v, index) => ({
          rank: index + 1,
          vendorId: v.vendorId,
          name: v.name,
          company: v.company,
          trustScore: v.trustScore,
          totalOrders: v.trustMetrics.totalOrders,
          successRate: v.trustMetrics.totalOrders > 0
            ? Math.round((v.trustMetrics.successfulOrders / v.trustMetrics.totalOrders) * 100)
            : 0
        }))
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
