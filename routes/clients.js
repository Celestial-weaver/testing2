const express = require("express")
const router = express.Router()
const Client = require("../models/Client")
const Order = require("../models/Order")
const { body, validationResult, query } = require("express-validator")

// Helper function to build filter query
const buildFilterQuery = (filters) => {
  const query = {}

  if (filters.username) {
    query.username = { $regex: filters.username, $options: "i" }
  }

  if (filters.email) {
    query.email = { $regex: filters.email, $options: "i" }
  }

  if (filters.city) {
    query["address.city"] = { $regex: filters.city, $options: "i" }
  }

  if (filters.state) {
    query["address.state"] = { $regex: filters.state, $options: "i" }
  }

  if (filters.planType) {
    query["currentPlan.planType"] = filters.planType
  }

  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive === "true"
  }

  if (filters.isVerified !== undefined) {
    query.isVerified = filters.isVerified === "true"
  }

  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {}
    if (filters.dateFrom) {
      query.createdAt.$gte = new Date(filters.dateFrom)
    }
    if (filters.dateTo) {
      query.createdAt.$lte = new Date(filters.dateTo)
    }
  }

  return query
}

// GET /api/clients - Get all clients with filtering
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("sortBy").optional().isIn(["createdAt", "username", "email", "lastLogin"]),
    query("sortOrder").optional().isIn(["asc", "desc"]),
    query("planType").optional().isIn(["free", "basic", "premium", "enterprise"]),
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
      const query = buildFilterQuery(filters)

      // Add search functionality
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { "address.city": { $regex: search, $options: "i" } },
        ]
      }

      // Calculate pagination
      const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)
      const sortOptions = {}
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1

      // Execute query
      const [clients, totalCount] = await Promise.all([
        Client.find(query)
          .select("-password")
          .sort(sortOptions)
          .skip(skip)
          .limit(Number.parseInt(limit))
          .populate("orders", "orderId status pricing.totalAmount eventDateTime")
          .populate("favouritePartners.partnerId", "username companyName profilePic"),
        Client.countDocuments(query),
      ])

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / Number.parseInt(limit))
      const hasNextPage = Number.parseInt(page) < totalPages
      const hasPrevPage = Number.parseInt(page) > 1

      res.json({
        success: true,
        data: clients,
        pagination: {
          currentPage: Number.parseInt(page),
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: Number.parseInt(limit),
        },
        filters: filters,
        message: `Retrieved ${clients.length} clients successfully`,
      })
    } catch (error) {
      console.error("Error fetching clients:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch clients",
        error: error.message,
      })
    }
  },
)

// GET /api/clients/:id - Get single client
router.get("/:id", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .select("-password")
      .populate("orders")
      .populate("favouritePartners.partnerId")

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      })
    }

    res.json({
      success: true,
      data: client,
      message: "Client retrieved successfully",
    })
  } catch (error) {
    console.error("Error fetching client:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch client",
      error: error.message,
    })
  }
})

// POST /api/clients - Create new client
router.post(
  "/",
  [
    body("username").trim().isLength({ min: 3, max: 30 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("phoneNo").matches(/^\+?[\d\s-()]+$/),
    body("address.city").optional().trim(),
    body("address.state").optional().trim(),
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

      // Check if client already exists
      const existingClient = await Client.findOne({
        $or: [{ email: req.body.email }, { username: req.body.username }],
      })

      if (existingClient) {
        return res.status(409).json({
          success: false,
          message: "Client with this email or username already exists",
        })
      }

      const client = new Client(req.body)
      await client.save()

      res.status(201).json({
        success: true,
        data: client,
        message: "Client created successfully",
      })
    } catch (error) {
      console.error("Error creating client:", error)
      res.status(500).json({
        success: false,
        message: "Failed to create client",
        error: error.message,
      })
    }
  },
)

// PUT /api/clients/:id - Update client
router.put(
  "/:id",
  [
    body("username").optional().trim().isLength({ min: 3, max: 30 }),
    body("email").optional().isEmail().normalizeEmail(),
    body("phoneNo")
      .optional()
      .matches(/^\+?[\d\s-()]+$/),
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

      const client = await Client.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedAt: new Date() },
        { new: true, runValidators: true },
      ).select("-password")

      if (!client) {
        return res.status(404).json({
          success: false,
          message: "Client not found",
        })
      }

      res.json({
        success: true,
        data: client,
        message: "Client updated successfully",
      })
    } catch (error) {
      console.error("Error updating client:", error)
      res.status(500).json({
        success: false,
        message: "Failed to update client",
        error: error.message,
      })
    }
  },
)

// DELETE /api/clients/:id - Delete client
router.delete("/:id", async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id)

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      })
    }

    res.json({
      success: true,
      message: "Client deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting client:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete client",
      error: error.message,
    })
  }
})

// GET /api/clients/:id/orders - Get client's orders
router.get("/:id/orders", async (req, res) => {
  try {
    const { status, dateFrom, dateTo, page = 1, limit = 10 } = req.query

    const query = { clientId: req.params.id }

    if (status) {
      query.status = status
    }

    if (dateFrom || dateTo) {
      query.eventDateTime = {}
      if (dateFrom) query.eventDateTime.$gte = new Date(dateFrom)
      if (dateTo) query.eventDateTime.$lte = new Date(dateTo)
    }

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    const orders = await Order.find(query)
      .populate("partnerId", "username companyName profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))

    const totalCount = await Order.countDocuments(query)

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(totalCount / Number.parseInt(limit)),
        totalCount,
        limit: Number.parseInt(limit),
      },
      message: "Client orders retrieved successfully",
    })
  } catch (error) {
    console.error("Error fetching client orders:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch client orders",
      error: error.message,
    })
  }
})

module.exports = router
