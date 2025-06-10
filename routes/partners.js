const express = require("express")
const router = express.Router()
const Partner = require("../models/Partner")
const { body, validationResult, query } = require("express-validator")

// Helper function to build filter query for partners
const buildPartnerFilterQuery = (filters) => {
  const query = {}

  if (filters.username) {
    query.username = { $regex: filters.username, $options: "i" }
  }

  if (filters.companyName) {
    query.companyName = { $regex: filters.companyName, $options: "i" }
  }

  if (filters.email) {
    query.email = { $regex: filters.email, $options: "i" }
  }

  if (filters.city) {
    query["locations.city"] = { $regex: filters.city, $options: "i" }
  }

  if (filters.shootType) {
    query.shootType = { $in: Array.isArray(filters.shootType) ? filters.shootType : [filters.shootType] }
  }

  if (filters.planType) {
    query["currentPlan.planType"] = filters.planType
  }

  if (filters.verified !== undefined) {
    query.verified = filters.verified === "true"
  }

  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive === "true"
  }

  if (filters.partnerType) {
    query.partnerType = filters.partnerType
  }

  if (filters.minRating) {
    query["ratings.average"] = { $gte: Number.parseFloat(filters.minRating) }
  }

  if (filters.maxPrice) {
    query.pricePerDay = { $lte: Number.parseFloat(filters.maxPrice) }
  }

  if (filters.minPrice) {
    query.pricePerDay = { ...query.pricePerDay, $gte: Number.parseFloat(filters.minPrice) }
  }

  if (filters.yearsOfExperience) {
    query.yearsOfExperience = { $gte: Number.parseInt(filters.yearsOfExperience) }
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

// GET /api/partners - Get all partners with advanced filtering
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("sortBy").optional().isIn(["createdAt", "username", "companyName", "ratings.average", "pricePerDay"]),
    query("sortOrder").optional().isIn(["asc", "desc"]),
    query("verified").optional().isBoolean(),
    query("isActive").optional().isBoolean(),
    query("planType").optional().isIn(["free", "basic", "premium", "enterprise"]),
    query("partnerType").optional().isIn(["individual", "company", "agency"]),
    query("minRating").optional().isFloat({ min: 0, max: 5 }),
    query("minPrice").optional().isFloat({ min: 0 }),
    query("maxPrice").optional().isFloat({ min: 0 }),
    query("yearsOfExperience").optional().isInt({ min: 0 }),
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
      const query = buildPartnerFilterQuery(filters)

      // Add search functionality
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: "i" } },
          { companyName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { "locations.city": { $regex: search, $options: "i" } },
          { shootType: { $regex: search, $options: "i" } },
          { specialization: { $regex: search, $options: "i" } },
        ]
      }

      // Calculate pagination
      const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)
      const sortOptions = {}
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1

      // Execute query
      const [partners, totalCount] = await Promise.all([
        Partner.find(query)
          .select("-password")
          .sort(sortOptions)
          .skip(skip)
          .limit(Number.parseInt(limit))
          .populate("projects.all", "orderId status eventDateTime")
          .populate("reviews.clientId", "username profilePic"),
        Partner.countDocuments(query),
      ])

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / Number.parseInt(limit))
      const hasNextPage = Number.parseInt(page) < totalPages
      const hasPrevPage = Number.parseInt(page) > 1

      res.json({
        success: true,
        data: partners,
        pagination: {
          currentPage: Number.parseInt(page),
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: Number.parseInt(limit),
        },
        filters: filters,
        message: `Retrieved ${partners.length} partners successfully`,
      })
    } catch (error) {
      console.error("Error fetching partners:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch partners",
        error: error.message,
      })
    }
  },
)

// GET /api/partners/search - Advanced search with location and availability
router.get(
  "/search",
  [
    query("location").optional(),
    query("date").optional().isISO8601(),
    query("shootType").optional(),
    query("budget").optional().isFloat({ min: 0 }),
    query("radius")
      .optional()
      .isInt({ min: 1, max: 100 }), // km radius
  ],
  async (req, res) => {
    try {
      const { location, date, shootType, budget, radius = 50 } = req.query
      const query = { isActive: true, verified: true }

      // Filter by shoot type
      if (shootType) {
        query.shootType = { $in: Array.isArray(shootType) ? shootType : [shootType] }
      }

      // Filter by budget
      if (budget) {
        query.$or = [
          { pricePerDay: { $lte: Number.parseFloat(budget) } },
          { "packages.price": { $lte: Number.parseFloat(budget) } },
        ]
      }

      // Location-based search (simplified - you might want to use MongoDB geospatial queries)
      if (location) {
        query["locations.city"] = { $regex: location, $options: "i" }
      }

      // Availability check (simplified)
      if (date) {
        const requestedDate = new Date(date)
        const dayOfWeek = requestedDate.toLocaleLowerCase().substring(0, 3) // mon, tue, etc.

        query["availability.blackoutDates.date"] = { $ne: requestedDate }
      }

      const partners = await Partner.find(query)
        .select(
          "username companyName profilePic banner shootType locations pricePerDay packages ratings verified yearsOfExperience",
        )
        .sort({ "ratings.average": -1, verified: -1 })
        .limit(20)

      res.json({
        success: true,
        data: partners,
        count: partners.length,
        searchCriteria: { location, date, shootType, budget, radius },
        message: "Search completed successfully",
      })
    } catch (error) {
      console.error("Error searching partners:", error)
      res.status(500).json({
        success: false,
        message: "Failed to search partners",
        error: error.message,
      })
    }
  },
)

// GET /api/partners/:id - Get single partner with full details
router.get("/:id", async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id)
      .select("-password")
      .populate("projects.all", "orderId status eventDateTime clientId")
      .populate("reviews.clientId", "username profilePic")
      .populate("clients", "username profilePic")

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      })
    }

    res.json({
      success: true,
      data: partner,
      message: "Partner retrieved successfully",
    })
  } catch (error) {
    console.error("Error fetching partner:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch partner",
      error: error.message,
    })
  }
})

// POST /api/partners - Create new partner
router.post(
  "/",
  [
    body("username").trim().isLength({ min: 3, max: 30 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("companyName").trim().isLength({ min: 2, max: 100 }),
    body("phoneNo").matches(/^\+?[\d\s-()]+$/),
    body("shootType").isArray({ min: 1 }),
    body("partnerType").isIn(["individual", "company", "agency"]),
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

      // Check if partner already exists
      const existingPartner = await Partner.findOne({
        $or: [{ email: req.body.email }, { username: req.body.username }],
      })

      if (existingPartner) {
        return res.status(409).json({
          success: false,
          message: "Partner with this email or username already exists",
        })
      }

      const partner = new Partner(req.body)
      await partner.save()

      res.status(201).json({
        success: true,
        data: partner,
        message: "Partner created successfully",
      })
    } catch (error) {
      console.error("Error creating partner:", error)
      res.status(500).json({
        success: false,
        message: "Failed to create partner",
        error: error.message,
      })
    }
  },
)

// PUT /api/partners/:id - Update partner
router.put("/:id", async (req, res) => {
  try {
    const partner = await Partner.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).select("-password")

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      })
    }

    res.json({
      success: true,
      data: partner,
      message: "Partner updated successfully",
    })
  } catch (error) {
    console.error("Error updating partner:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update partner",
      error: error.message,
    })
  }
})

// GET /api/partners/:id/availability - Check partner availability
router.get(
  "/:id/availability",
  [
    query("date").optional().isISO8601(),
    query("month")
      .optional()
      .matches(/^\d{4}-\d{2}$/), // YYYY-MM format
  ],
  async (req, res) => {
    try {
      const { date, month } = req.query

      const partner = await Partner.findById(req.params.id).select("availability partnerId username")

      if (!partner) {
        return res.status(404).json({
          success: false,
          message: "Partner not found",
        })
      }

      let availabilityData = partner.availability

      // If specific date requested, check that date
      if (date) {
        const requestedDate = new Date(date)
        const isBlackedOut = partner.availability.blackoutDates.some(
          (blackout) => blackout.date.toDateString() === requestedDate.toDateString(),
        )

        availabilityData = {
          date: requestedDate,
          available: !isBlackedOut,
          schedule: partner.availability.schedule,
        }
      }

      res.json({
        success: true,
        data: availabilityData,
        message: "Availability retrieved successfully",
      })
    } catch (error) {
      console.error("Error fetching availability:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch availability",
        error: error.message,
      })
    }
  },
)

module.exports = router
