const jwt = require("jsonwebtoken")
const Client = require("../models/Client")
const Partner = require("../models/Partner")
const Admin = require("../models/Admin")

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    let user
    switch (decoded.userType) {
      case "Client":
        user = await Client.findById(decoded.id).select("-password")
        break
      case "Partner":
        user = await Partner.findById(decoded.id).select("-password")
        break
      case "Admin":
        user = await Admin.findById(decoded.id).select("-password")
        break
      default:
        return res.status(401).json({
          success: false,
          message: "Invalid user type",
        })
    }

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    })
  }
}

// Authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      })
    }

    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      })
    }

    next()
  }
}

module.exports = { authenticate, authorize }
