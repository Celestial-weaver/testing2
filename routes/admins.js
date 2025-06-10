const express = require("express")
const router = express.Router()
const Admin = require("../models/Admin")
const Client = require("../models/Client")
const Partner = require("../models/Partner")
const Order = require("../models/Order")
const { body, validationResult, query } = require("express-validator")
const mongoose = require("mongoose")

// GET /api/admins/dashboard - Get comprehensive dashboard data
router.get("/dashboard", async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query

    const dateFilter = {}
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {}
      if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom)
      if (dateTo) dateFilter.createdAt.$lte = new Date(dateTo)
    }

    // Get counts and statistics
    const [
      totalClients,
      totalPartners,
      totalOrders,
      activeOrders,
      completedOrders,
      premiumClients,
      premiumPartners,
      verifiedPartners,
      recentOrders,
      topPartners,
      revenueStats,
    ] = await Promise.all([
      Client.countDocuments({ isActive: true, ...dateFilter }),
      Partner.countDocuments({ isActive: true, ...dateFilter }),
      Order.countDocuments(dateFilter),
      Order.countDocuments({ status: { $in: ["confirmed", "in_progress"] }, ...dateFilter }),
      Order.countDocuments({ status: "completed", ...dateFilter }),
      Client.countDocuments({ "currentPlan.planType": { $in: ["premium", "enterprise"] }, ...dateFilter }),
      Partner.countDocuments({ "currentPlan.planType": { $in: ["premium", "enterprise"] }, ...dateFilter }),
      Partner.countDocuments({ verified: true, ...dateFilter }),
      Order.find(dateFilter)
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("clientId", "username profilePic")
        .populate("partnerId", "username companyName profilePic"),
      Partner.find({ verified: true, isActive: true })
        .sort({ "ratings.average": -1, "ratings.totalReviews": -1 })
        .limit(5)
        .select("username companyName profilePic ratings totalRevenue"),
      Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$pricing.totalAmount" },
            averageOrderValue: { $avg: "$pricing.totalAmount" },
            totalOrders: { $sum: 1 },
          },
        },
      ]),
    ])

    // System health check (simplified)
    const systemHealth = {
      serverStatus: "healthy",
      databaseStatus: "connected",
      apiResponseTime: Math.random() * 100 + 50, // Mock response time
      errorRate: Math.random() * 5, // Mock error rate
      activeUsers: Math.floor(Math.random() * 1000) + 100,
      lastChecked: new Date(),
    }

    const dashboardData = {
      overview: {
        totalClients,
        totalPartners,
        totalOrders,
        activeOrders,
        completedOrders,
        premiumClients,
        premiumPartners,
        verifiedPartners,
      },
      revenue: revenueStats[0] || { totalRevenue: 0, averageOrderValue: 0, totalOrders: 0 },
      recentOrders,
      topPartners,
      systemHealth,
      lastUpdated: new Date(),
    }

    res.json({
      success: true,
      data: dashboardData,
      message: "Dashboard data retrieved successfully",
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message,
    })
  }
})

// GET /api/admins/system-health - Get detailed system health
router.get("/system-health", async (req, res) => {
  try {
    // Database connection check
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected"

    // Get recent error logs (you'd implement proper logging)
    const recentErrors = [] // Mock data

    // Performance metrics
    const performanceMetrics = {
      avgResponseTime: Math.random() * 100 + 50,
      errorRate: Math.random() * 5,
      throughput: Math.random() * 1000 + 500,
      uptime: process.uptime(),
    }

    // Active users (simplified)
    const activeUsers = await Promise.all([
      Client.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Partner.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
    ])

    const systemHealth = {
      status: "healthy",
      database: {
        status: dbStatus,
        connectionCount: mongoose.connections.length,
      },
      performance: performanceMetrics,
      activeUsers: {
        clients: activeUsers[0],
        partners: activeUsers[1],
        total: activeUsers[0] + activeUsers[1],
      },
      recentErrors,
      lastChecked: new Date(),
    }

    res.json({
      success: true,
      data: systemHealth,
      message: "System health retrieved successfully",
    })
  } catch (error) {
    console.error("Error fetching system health:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch system health",
      error: error.message,
    })
  }
})

// GET /api/admins/analytics - Get comprehensive analytics
router.get(
  "/analytics",
  [
    query("period").optional().isIn(["7d", "30d", "90d", "1y"]),
    query("metric").optional().isIn(["revenue", "orders", "users", "engagement"]),
  ],
  async (req, res) => {
    try {
      const { period = "30d", metric = "revenue" } = req.query

      // Calculate date range
      const periodDays = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "1y": 365,
      }

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - periodDays[period])

      let analytics = {}

      switch (metric) {
        case "revenue":
          analytics = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                revenue: { $sum: "$pricing.totalAmount" },
                orders: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ])
          break

        case "users":
          const clientSignups = await Client.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                clients: { $sum: 1 },
              },
            },
          ])

          const partnerSignups = await Partner.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                partners: { $sum: 1 },
              },
            },
          ])

          analytics = { clientSignups, partnerSignups }
          break

        default:
          analytics = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ])
      }

      res.json({
        success: true,
        data: analytics,
        period,
        metric,
        message: "Analytics retrieved successfully",
      })
    } catch (error) {
      console.error("Error fetching analytics:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch analytics",
        error: error.message,
      })
    }
  },
)

module.exports = router
