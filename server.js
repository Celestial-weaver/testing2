const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const compression = require("compression")
const rateLimit = require("express-rate-limit")
require("dotenv").config()

const app = express()

// Security middleware
app.use(helmet())
app.use(compression())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
})
app.use(limiter)

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  }),
)

// Body parsing middleware
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

// Static files
app.use("/uploads", express.static("uploads"))

// MongoDB Connection with better error handling
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/pixisphere", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const db = mongoose.connection
db.on("error", (error) => {
  console.error("MongoDB connection error:", error)
  process.exit(1)
})
db.once("open", () => {
  console.log("✅ Connected to MongoDB successfully")
})

// Import Routes
const clientRoutes = require("./routes/clients")
const partnerRoutes = require("./routes/partners")
const orderRoutes = require("./routes/orders")
const adminRoutes = require("./routes/admins")
const authRoutes = require("./routes/auth")

// Use Routes
app.use("/api/auth", authRoutes)
app.use("/api/clients", clientRoutes)
app.use("/api/partners", partnerRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/admins", adminRoutes)

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Pixisphere API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  })
})

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Pixisphere API",
    version: "1.0.0",
    documentation: "/api/docs",
    health: "/api/health",
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack)

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors,
    })
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    })
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    })
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      "GET /api/health",
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/clients",
      "GET /api/partners",
      "GET /api/orders",
      "GET /api/admins/dashboard",
    ],
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`🔗 API URL: http://localhost:${PORT}`)
})

module.exports = app
