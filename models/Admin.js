const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const adminSchema = new mongoose.Schema(
  {
    // Personal Info
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    phoneNo: {
      type: String,
      required: true,
      match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
    },
    userType: {
      type: String,
      default: "Admin",
      enum: ["Admin", "SuperAdmin"],
    },
    adminId: {
      type: String,
      unique: true,
      default: () => "ADM_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
    },

    // Permissions
    permissions: [
      {
        module: {
          type: String,
          enum: ["users", "partners", "orders", "reviews", "content", "system", "analytics"],
        },
        actions: [
          {
            type: String,
            enum: ["create", "read", "update", "delete", "approve", "reject"],
          },
        ],
      },
    ],

    // Operational Requirements
    reviews: [
      {
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
        clientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Client",
        },
        partnerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Partner",
        },
        rating: Number,
        comment: String,
        status: {
          type: String,
          enum: ["pending", "approved", "rejected", "flagged"],
          default: "pending",
        },
        moderatedAt: Date,
        moderationNote: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    faqs: [
      {
        question: {
          type: String,
          required: true,
        },
        answer: {
          type: String,
          required: true,
        },
        category: String,
        isActive: {
          type: Boolean,
          default: true,
        },
        order: Number,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: Date,
      },
    ],

    feedbacks: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        userType: {
          type: String,
          enum: ["Client", "Partner"],
        },
        type: {
          type: String,
          enum: ["bug_report", "feature_request", "general_feedback", "complaint"],
        },
        subject: String,
        message: String,
        priority: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          default: "medium",
        },
        status: {
          type: String,
          enum: ["new", "in_progress", "resolved", "closed"],
          default: "new",
        },
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
        },
        response: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        resolvedAt: Date,
      },
    ],

    requests: [
      {
        type: {
          type: String,
          enum: ["partner_verification", "refund_request", "account_deletion", "data_export", "dispute_resolution"],
        },
        requesterId: mongoose.Schema.Types.ObjectId,
        requesterType: {
          type: String,
          enum: ["Client", "Partner"],
        },
        details: mongoose.Schema.Types.Mixed,
        status: {
          type: String,
          enum: ["pending", "approved", "rejected", "in_review"],
          default: "pending",
        },
        priority: {
          type: String,
          enum: ["low", "medium", "high", "urgent"],
          default: "medium",
        },
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
        },
        notes: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        processedAt: Date,
      },
    ],

    blogs: [
      {
        title: {
          type: String,
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        excerpt: String,
        featuredImage: {
          url: String,
          publicId: String,
        },
        category: String,
        tags: [String],
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
        },
        status: {
          type: String,
          enum: ["draft", "published", "archived"],
          default: "draft",
        },
        publishedAt: Date,
        views: {
          type: Number,
          default: 0,
        },
        likes: {
          type: Number,
          default: 0,
        },
        seoTitle: String,
        seoDescription: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: Date,
      },
    ],

    // Social Media Management
    socialMedia: {
      instagram: {
        pageUrl: String,
        accessToken: String,
        lastSync: Date,
      },
      facebook: {
        pageUrl: String,
        accessToken: String,
        lastSync: Date,
      },
      twitter: {
        pageUrl: String,
        accessToken: String,
        lastSync: Date,
      },
      pinterest: {
        pageUrl: String,
        accessToken: String,
        lastSync: Date,
      },
      youtube: {
        channelUrl: String,
        accessToken: String,
        lastSync: Date,
      },
    },

    // Tutorials and How It Works
    tutorials: [
      {
        title: String,
        description: String,
        videoUrl: String,
        thumbnailUrl: String,
        category: {
          type: String,
          enum: ["getting_started", "for_clients", "for_partners", "advanced_features"],
        },
        duration: String,
        order: Number,
        isActive: {
          type: Boolean,
          default: true,
        },
        views: {
          type: Number,
          default: 0,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Shoot Categories Management
    shootCategories: [
      {
        name: {
          type: String,
          required: true,
          unique: true,
        },
        description: String,
        icon: String,
        isActive: {
          type: Boolean,
          default: true,
        },
        order: Number,
        subcategories: [String],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Dashboard Analytics
    dashboardData: {
      totalProjects: Number,
      activeProjects: Number,
      completedProjects: Number,
      totalClients: Number,
      totalPartners: Number,
      premiumPartners: Number,
      premiumClients: Number,
      monthlyRevenue: Number,
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },

    // System Health Monitoring
    systemHealth: {
      serverStatus: String,
      databaseStatus: String,
      apiResponseTime: Number,
      errorRate: Number,
      activeUsers: Number,
      lastChecked: {
        type: Date,
        default: Date.now,
      },
      alerts: [
        {
          type: String,
          message: String,
          severity: {
            type: String,
            enum: ["info", "warning", "error", "critical"],
          },
          timestamp: Date,
          resolved: Boolean,
        },
      ],
    },

    // Recent Activities
    recentActivities: [
      {
        type: String,
        description: String,
        userId: mongoose.Schema.Types.ObjectId,
        userType: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        metadata: mongoose.Schema.Types.Mixed,
      },
    ],

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    loginHistory: [
      {
        timestamp: Date,
        ipAddress: String,
        userAgent: String,
        location: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes
adminSchema.index({ email: 1 })
adminSchema.index({ adminId: 1 })
adminSchema.index({ userType: 1 })

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Remove password from JSON output
adminSchema.methods.toJSON = function () {
  const adminObject = this.toObject()
  delete adminObject.password
  return adminObject
}

module.exports = mongoose.model("Admin", adminSchema)
