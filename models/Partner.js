const mongoose = require("mongoose")

const partnerSchema = new mongoose.Schema(
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
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    shootType: [
      {
        type: String,
        enum: [
          "wedding",
          "portrait",
          "event",
          "commercial",
          "fashion",
          "product",
          "real_estate",
          "food",
          "travel",
          "sports",
          "maternity",
          "newborn",
          "family",
          "corporate",
          "architecture",
        ],
      },
    ],
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
    documents: [
      {
        type: {
          type: String,
          enum: ["business_license", "tax_certificate", "insurance", "portfolio", "certification"],
        },
        url: String,
        publicId: String,
        verified: {
          type: Boolean,
          default: false,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    profilePic: {
      url: String,
      publicId: String,
      optimized: Boolean,
    },
    banner: {
      url: String,
      publicId: String,
      optimized: Boolean,
    },
    portfolio: [
      {
        title: String,
        description: String,
        images: [
          {
            url: String,
            publicId: String,
            caption: String,
          },
        ],
        category: String,
        featured: Boolean,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    yearsOfExperience: {
      type: Number,
      min: 0,
      max: 50,
    },
    userType: {
      type: String,
      default: "Partner",
      enum: ["Partner"],
    },
    partnerId: {
      type: String,
      unique: true,
      default: () => "PAR_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
    },

    // Current Plan
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

    // Operational Data
    availability: {
      schedule: [
        {
          day: {
            type: String,
            enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
          },
          available: Boolean,
          timeSlots: [
            {
              startTime: String,
              endTime: String,
              booked: Boolean,
            },
          ],
        },
      ],
      blackoutDates: [
        {
          date: Date,
          reason: String,
        },
      ],
      timezone: String,
    },

    packages: [
      {
        name: String,
        description: String,
        price: Number,
        duration: String,
        inclusions: [String],
        shootTypes: [String],
        isActive: {
          type: Boolean,
          default: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    pricePerDay: {
      type: Number,
      min: 0,
    },

    paymentMethods: [
      {
        type: {
          type: String,
          enum: ["bank_transfer", "paypal", "stripe", "cash", "check"],
        },
        details: mongoose.Schema.Types.Mixed,
        isActive: Boolean,
      },
    ],

    locations: [
      {
        city: String,
        state: String,
        country: String,
        serviceRadius: Number,
        travelCharges: Number,
      },
    ],

    partnerType: {
      type: String,
      enum: ["individual", "company", "agency"],
      default: "individual",
    },

    specialization: [String],

    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      totalReviews: {
        type: Number,
        default: 0,
      },
      breakdown: {
        five: { type: Number, default: 0 },
        four: { type: Number, default: 0 },
        three: { type: Number, default: 0 },
        two: { type: Number, default: 0 },
        one: { type: Number, default: 0 },
      },
    },

    verified: {
      type: Boolean,
      default: false,
    },

    // Social Media
    socialMedia: {
      instagram: String,
      facebook: String,
      twitter: String,
      pinterest: String,
      youtube: String,
    },

    reviews: [
      {
        clientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Client",
        },
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        response: String,
        helpful: {
          type: Number,
          default: 0,
        },
      },
    ],

    activities: [
      {
        type: {
          type: String,
          enum: ["order_received", "order_completed", "review_received", "profile_updated", "package_updated"],
        },
        description: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        relatedId: mongoose.Schema.Types.ObjectId,
      },
    ],

    // Dashboard Data
    projects: {
      all: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
      ],
      active: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
      ],
      completed: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
      ],
      pending: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
      ],
    },

    clients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
      },
    ],

    transactions: [
      {
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
        amount: Number,
        type: {
          type: String,
          enum: ["payment_received", "refund", "commission_deducted"],
        },
        status: {
          type: String,
          enum: ["pending", "completed", "failed"],
          default: "pending",
        },
        date: {
          type: Date,
          default: Date.now,
        },
        paymentMethod: String,
      },
    ],

    totalRevenue: {
      type: Number,
      default: 0,
    },

    inquiries: [
      {
        clientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Client",
        },
        subject: String,
        message: String,
        status: {
          type: String,
          enum: ["new", "responded", "closed"],
          default: "new",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        response: String,
      },
    ],

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes
partnerSchema.index({ email: 1 })
partnerSchema.index({ partnerId: 1 })
partnerSchema.index({ firebaseUid: 1 })
partnerSchema.index({ "locations.city": 1 })
partnerSchema.index({ shootType: 1 })
partnerSchema.index({ "ratings.average": -1 })
partnerSchema.index({ verified: 1 })

module.exports = mongoose.model("Partner", partnerSchema)
