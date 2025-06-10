const admin = require("firebase-admin")
const Client = require("../models/Client")
const Partner = require("../models/Partner")
const Admin = require("../models/Admin")

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

// Firebase authentication middleware
const authenticateFirebase = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      })
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token)

    // Find user in our database using Firebase UID
    const user =
      (await Client.findOne({ firebaseUid: decodedToken.uid }).select("-password")) ||
      (await Partner.findOne({ firebaseUid: decodedToken.uid }).select("-password")) ||
      (await Admin.findOne({ firebaseUid: decodedToken.uid }).select("-password"))

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found in database",
      })
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is inactive",
      })
    }

    req.user = user
    req.firebaseUser = decodedToken
    next()
  } catch (error) {
    console.error("Firebase auth error:", error)
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

module.exports = { authenticateFirebase, authorize, admin }
