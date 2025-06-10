const mongoose = require("mongoose")

const clientSchema = new mongoose.Schema(
  {
    // Firebase Integration
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Personal Data
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    profilePic: {
      url: String,
      publicId: String,
      optimized: Boolean,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    phoneNo: {
      type: String,
      required: true,
      match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
    },
    clientId: {
      type: String,
      unique: true,
      default: () => "CLI_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
    },
    userType: {
      type: String,
      default: "Client",
      enum: ["Client"],
    },

    // Operational Data
    favouritePartners: [
      {
        partnerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Partner",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],

    activities: [
      {
        type: {
          type: String,
          enum: ["order_placed", "order_completed", "review_given", "partner_favorited", "profile_updated"],
        },
        description: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        relatedId: mongoose.Schema.Types.ObjectId,
      },
    ],

    currentPlan: {
      planType: {
        type: String,
        enum: ["free", "basic", "premium", "enterprise"],
        default: "free",
      },
      startDate: Date,
      endDate: Date,
      features: [String],
      isActive: {
        type: Boolean,
        default: true,
      },
    },

    inquiries: [
      {
        subject: String,
        message: String,
        status: {
          type: String,
          enum: ["open", "in_progress", "resolved", "closed"],
          default: "open",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: Date,
        adminResponse: String,
      },
    ],

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes for better query performance
clientSchema.index({ email: 1 })
clientSchema.index({ clientId: 1 })
clientSchema.index({ username: 1 })
clientSchema.index({ firebaseUid: 1 })
clientSchema.index({ "currentPlan.planType": 1 })

module.exports = mongoose.model("Client", clientSchema)
