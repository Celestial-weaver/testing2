const express = require("express")
const router = express.Router()
const { body, validationResult } = require("express-validator")
const { admin } = require("../middleware/firebaseAuth")
const Client = require("../models/Client")
const Partner = require("../models/Partner")
const Admin = require("../models/Admin")

// POST /api/auth/register - Register new user with Firebase
router.post(
  "/register",
  [
    body("userType").isIn(["Client", "Partner"]),
    body("username").trim().isLength({ min: 3, max: 30 }),
    body("email").isEmail().normalizeEmail(),
    body("firebaseUid").notEmpty(),
    body("phoneNo").matches(/^\+?[\d\s-()]+$/),
    // Partner specific validations
    body("companyName")
      .if(body("userType").equals("Partner"))
      .notEmpty(),
    body("shootType").if(body("userType").equals("Partner")).isArray({ min: 1 }),
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

      const { userType, email, username, firebaseUid } = req.body

      // Verify Firebase user exists
      try {
        await admin.auth().getUser(firebaseUid)
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid Firebase user",
        })
      }

      // Check if user already exists
      let existingUser
      if (userType === "Client") {
        existingUser = await Client.findOne({
          $or: [{ email }, { username }, { firebaseUid }],
        })
      } else if (userType === "Partner") {
        existingUser = await Partner.findOne({
          $or: [{ email }, { username }, { firebaseUid }],
        })
      }

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "User with this email, username, or Firebase UID already exists",
        })
      }

      // Create new user
      let newUser
      const userData = { ...req.body, firebaseUid }

      if (userType === "Client") {
        newUser = new Client(userData)
      } else if (userType === "Partner") {
        newUser = new Partner(userData)
      }

      await newUser.save()

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: newUser,
        },
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to register user",
        error: error.message,
      })
    }
  },
)

// GET /api/auth/me - Get current user profile
router.get("/me", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      })
    }

    const decodedToken = await admin.auth().verifyIdToken(token)

    const user =
      (await Client.findOne({ firebaseUid: decodedToken.uid }).select("-password")) ||
      (await Partner.findOne({ firebaseUid: decodedToken.uid }).select("-password")) ||
      (await Admin.findOne({ firebaseUid: decodedToken.uid }).select("-password"))

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      })
    }

    res.json({
      success: true,
      data: user,
      message: "User profile retrieved successfully",
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(401).json({
      success: false,
      message: "Invalid token",
    })
  }
})

// POST /api/auth/link-account - Link existing account with Firebase
router.post(
  "/link-account",
  [
    body("email").isEmail().normalizeEmail(),
    body("firebaseUid").notEmpty(),
    body("userType").optional().isIn(["Client", "Partner", "Admin"]),
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

      const { email, firebaseUid, userType } = req.body

      // Verify Firebase user exists
      try {
        await admin.auth().getUser(firebaseUid)
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid Firebase user",
        })
      }

      let user
      let Model

      if (userType) {
        switch (userType) {
          case "Client":
            Model = Client
            break
          case "Partner":
            Model = Partner
            break
          case "Admin":
            Model = Admin
            break
          default:
            return res.status(400).json({
              success: false,
              message: "Invalid user type",
            })
        }
        user = await Model.findOne({ email, isActive: true })
      } else {
        // Search in all collections
        user =
          (await Client.findOne({ email, isActive: true })) ||
          (await Partner.findOne({ email, isActive: true })) ||
          (await Admin.findOne({ email, isActive: true }))
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      // Update user with Firebase UID
      user.firebaseUid = firebaseUid
      user.lastLogin = new Date()
      await user.save()

      res.json({
        success: true,
        message: "Account linked successfully",
        data: {
          user,
        },
      })
    } catch (error) {
      console.error("Link account error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to link account",
        error: error.message,
      })
    }
  },
)

module.exports = router
