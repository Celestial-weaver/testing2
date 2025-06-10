const express = require("express")
const router = express.Router()
const Order = require("../models/Order")
const { body, validationResult, query } = require("express-validator")

// Helper function to build filter query for orders
const buildOrderFilterQuery = (filters) => {
  const query = {}

  if (filters.clientId) {
    query.clientId = filters.clientId
  }

  if (filters.partnerId) {
    query.partnerId = filters.partnerId
  }

  if (filters.status) {
    query.status = { $in: Array.isArray(filters.status) ? filters.status : [filters.status] }
  }

  if (filters.orderName) {
    query.orderName = { $regex: filters.orderName, $options: "i" }
  }

  if (filters.location) {
    query["location.address.city"] = { $regex: filters.location, $options: "i" }
  }

  if (filters.eventType) {
    query["eventDetails.eventType"] = { $regex: filters.eventType, $options: "i" }
  }

  if (filters.minAmount) {
    query["pricing.totalAmount"] = { $gte: Number.parseFloat(filters.minAmount) }
  }

  if (filters.maxAmount) {
    query["pricing.totalAmount"] = { ...query["pricing.totalAmount"], $lte: Number.parseFloat(filters.maxAmount) }
  }

  if (filters.paymentStatus) {
    query["payment.status"] = filters.paymentStatus
  }

  if (filters.eventDateFrom || filters.eventDateTo) {
    query.eventDateTime = {}
    if (filters.eventDateFrom) {
      query.eventDateTime.$gte = new Date(filters.eventDateFrom)
    }
    if (filters.eventDateTo) {
      query.eventDateTime.$lte = new Date(filters.eventDateTo)
    }
  }

  if (filters.bookingDateFrom || filters.bookingDateTo) {
    query.bookingDateTime = {}
    if (filters.bookingDateFrom) {
      query.bookingDateTime.$gte = new Date(filters.bookingDateFrom)
    }
    if (filters.bookingDateTo) {
      query.bookingDateTime.$lte = new Date(filters.bookingDateTo)
    }
  }

  if (filters.progressMin) {
    query["progress.percentage"] = { $gte: Number.parseInt(filters.progressMin) }
  }

  if (filters.progressMax) {
    query["progress.percentage"] = { ...query["progress.percentage"], $lte: Number.parseInt(filters.progressMax) }
  }

  if (filters.currentStage) {
    query["progress.currentStage"] = filters.currentStage
  }

  return query
}

// GET /api/orders - Get all orders with comprehensive filtering
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("sortBy")
      .optional()
      .isIn(["createdAt", "eventDateTime", "bookingDateTime", "pricing.totalAmount", "progress.percentage"]),
    query("sortOrder").optional().isIn(["asc", "desc"]),
    query("status").optional(),
    query("paymentStatus").optional().isIn(["pending", "partial", "completed", "refunded"]),
    query("currentStage")
      .optional()
      .isIn(["booking_confirmed", "preparation", "shoot_day", "post_processing", "delivery", "completed"]),
    query("minAmount").optional().isFloat({ min: 0 }),
    query("maxAmount").optional().isFloat({ min: 0 }),
    query("progressMin").optional().isInt({ min: 0, max: 100 }),
    query("progressMax").optional().isInt({ min: 0, max: 100 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search, ...filters } = req.query

      // Build filter query
      const query = buildOrderFilterQuery(filters)

      // Add search functionality
      if (search) {
        query.$or = [
          { orderName: { $regex: search, $options: "i" } },
          { orderId: { $regex: search, $options: "i" } },
          { "eventDetails.eventName": { $regex: search, $options: "i" } },
          { "location.venue": { $regex: search, $options: "i" } },
          { "location.address.city": { $regex: search, $options: "i" } },
        ]
      }

      // Calculate pagination
      const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)
      const sortOptions = {}
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1

      // Execute query
      const [orders, totalCount] = await Promise.all([
        Order.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(Number.parseInt(limit))
          .populate("clientId", "username email profilePic clientId")
          .populate("partnerId", "username companyName profilePic partnerId"),
        Order.countDocuments(query),
      ])

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / Number.parseInt(limit))
      const hasNextPage = Number.parseInt(page) < totalPages
      const hasPrevPage = Number.parseInt(page) > 1

      // Calculate summary statistics
      const summaryStats = await Order.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$pricing.totalAmount" },
            averageOrderValue: { $avg: "$pricing.totalAmount" },
            statusBreakdown: {
              $push: "$status",
            },
          },
        },
      ])

      res.json({
        success: true,
        data: orders,
        pagination: {
          currentPage: Number.parseInt(page),
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: Number.parseInt(limit),
        },
        summary: summaryStats[0] || {},
        filters: filters,
        message: `Retrieved ${orders.length} orders successfully`,
      })
    } catch (error) {
      console.error("Error fetching orders:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch orders",
        error: error.message,
      })
    }
  },
)

// GET /api/orders/:id - Get single order with full details
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("clientId", "username email phoneNo profilePic")
      .populate("partnerId", "username companyName email phoneNo profilePic")

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    res.json({
      success: true,
      data: order,
      message: "Order retrieved successfully",
    })
  } catch (error) {
    console.error("Error fetching order:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    })
  }
})

// POST /api/orders - Create new order
router.post(
  "/",
  [
    body("orderName").trim().isLength({ min: 3, max: 100 }),
    body("clientId").isMongoId(),
    body("partnerId").isMongoId(),
    body("eventDateTime").isISO8601(),
    body("pricing.totalAmount").isFloat({ min: 0 }),
    body("location.venue").optional().trim(),
    body("eventDetails.eventType").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const order = new Order(req.body)
      await order.save()

      // Populate the created order
      await order.populate("clientId", "username email profilePic")
      await order.populate("partnerId", "username companyName profilePic")

      res.status(201).json({
        success: true,
        data: order,
        message: "Order created successfully",
      })
    } catch (error) {
      console.error("Error creating order:", error)
      res.status(500).json({
        success: false,
        message: "Failed to create order",
        error: error.message,
      })
    }
  },
)

// PUT /api/orders/:id - Update order
router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true },
    )
      .populate("clientId", "username email profilePic")
      .populate("partnerId", "username companyName profilePic")

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    res.json({
      success: true,
      data: order,
      message: "Order updated successfully",
    })
  } catch (error) {
    console.error("Error updating order:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update order",
      error: error.message,
    })
  }
})

// GET /api/orders/analytics/dashboard - Get order analytics for dashboard
router.get(
  "/analytics/dashboard",
  [
    query("dateFrom").optional().isISO8601(),
    query("dateTo").optional().isISO8601(),
    query("groupBy").optional().isIn(["day", "week", "month", "year"]),
  ],
  async (req, res) => {
    try {
      const { dateFrom, dateTo, groupBy = "month" } = req.query

      const matchStage = {}
      if (dateFrom || dateTo) {
        matchStage.createdAt = {}
        if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom)
        if (dateTo) matchStage.createdAt.$lte = new Date(dateTo)
      }

      const analytics = await Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              status: "$status",
              period: {
                $dateToString: {
                  format:
                    groupBy === "day"
                      ? "%Y-%m-%d"
                      : groupBy === "week"
                        ? "%Y-%U"
                        : groupBy === "month"
                          ? "%Y-%m"
                          : "%Y",
                  date: "$createdAt",
                },
              },
            },
            count: { $sum: 1 },
            totalRevenue: { $sum: "$pricing.totalAmount" },
            averageOrderValue: { $avg: "$pricing.totalAmount" },
          },
        },
        {
          $group: {
            _id: "$_id.period",
            orders: {
              $push: {
                status: "$_id.status",
                count: "$count",
                revenue: "$totalRevenue",
                avgValue: "$averageOrderValue",
              },
            },
            totalOrders: { $sum: "$count" },
            totalRevenue: { $sum: "$totalRevenue" },
          },
        },
        { $sort: { _id: 1 } },
      ])

      res.json({
        success: true,
        data: analytics,
        period: { dateFrom, dateTo, groupBy },
        message: "Order analytics retrieved successfully",
      })
    } catch (error) {
      console.error("Error fetching order analytics:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch order analytics",
        error: error.message,
      })
    }
  },
)

module.exports = router
