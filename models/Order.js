const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema(
  {
    // Meta Data
    orderName: {
      type: String,
      required: true,
      trim: true,
    },
    orderId: {
      type: String,
      unique: true,
      default: () => "ORD_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
    },

    // Client Information
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    clientContact: {
      email: String,
      phone: String,
      name: String,
    },

    // Partner Information
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
    },
    partnerContact: {
      email: String,
      phone: String,
      name: String,
      companyName: String,
    },

    // Event Details
    eventDetails: {
      eventType: String,
      eventName: String,
      description: String,
      guestCount: Number,
      specialRequirements: [String],
    },

    eventDateTime: {
      type: Date,
      required: true,
    },

    bookingDateTime: {
      type: Date,
      default: Date.now,
    },

    location: {
      venue: String,
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
      accessInstructions: String,
    },

    // Pricing
    pricing: {
      basePrice: {
        type: Number,
        required: true,
      },
      additionalCharges: [
        {
          description: String,
          amount: Number,
        },
      ],
      discount: {
        amount: Number,
        reason: String,
        code: String,
      },
      taxes: {
        amount: Number,
        percentage: Number,
      },
      totalAmount: {
        type: Number,
        required: true,
      },
    },

    pricePerDay: Number,
    packageSelected: {
      packageId: String,
      packageName: String,
      inclusions: [String],
    },

    // Progress Tracking
    progress: {
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      milestones: [
        {
          name: String,
          description: String,
          completed: Boolean,
          completedAt: Date,
          dueDate: Date,
        },
      ],
      currentStage: {
        type: String,
        enum: ["booking_confirmed", "preparation", "shoot_day", "post_processing", "delivery", "completed"],
        default: "booking_confirmed",
      },
    },

    specialInstructions: {
      type: String,
      maxlength: 1000,
    },

    dataProvidingMethod: {
      type: String,
      enum: ["cloud_storage", "physical_media", "email", "ftp", "direct_download"],
      default: "cloud_storage",
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "in_progress", "completed", "cancelled", "refunded"],
      default: "pending",
    },

    offerings: [
      {
        type: String,
        description: String,
        included: Boolean,
      },
    ],

    duration: {
      hours: Number,
      days: Number,
      description: String,
    },

    // Payment Information
    payment: {
      method: String,
      status: {
        type: String,
        enum: ["pending", "partial", "completed", "refunded"],
        default: "pending",
      },
      transactions: [
        {
          amount: Number,
          date: Date,
          transactionId: String,
          method: String,
          status: String,
        },
      ],
      advanceAmount: Number,
      remainingAmount: Number,
      dueDate: Date,
    },

    // Communication
    messages: [
      {
        senderId: mongoose.Schema.Types.ObjectId,
        senderType: {
          type: String,
          enum: ["Client", "Partner", "Admin"],
        },
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        attachments: [
          {
            url: String,
            type: String,
            name: String,
          },
        ],
        read: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Deliverables
    deliverables: [
      {
        type: {
          type: String,
          enum: ["photos", "videos", "edited_photos", "raw_files", "album", "prints"],
        },
        description: String,
        files: [
          {
            url: String,
            name: String,
            size: Number,
            format: String,
            uploadedAt: Date,
          },
        ],
        deliveredAt: Date,
        status: {
          type: String,
          enum: ["pending", "processing", "ready", "delivered"],
          default: "pending",
        },
      },
    ],

    // Reviews and Feedback
    review: {
      clientReview: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
        createdAt: Date,
      },
      partnerReview: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
        createdAt: Date,
      },
    },

    // Cancellation
    cancellation: {
      cancelledBy: {
        type: String,
        enum: ["Client", "Partner", "Admin"],
      },
      reason: String,
      cancelledAt: Date,
      refundAmount: Number,
      refundStatus: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes for better query performance
orderSchema.index({ clientId: 1 })
orderSchema.index({ partnerId: 1 })
orderSchema.index({ status: 1 })
orderSchema.index({ eventDateTime: 1 })
orderSchema.index({ bookingDateTime: -1 })
orderSchema.index({ orderId: 1 })

// Virtual for order age
orderSchema.virtual("orderAge").get(function () {
  return Math.floor((Date.now() - this.bookingDateTime) / (1000 * 60 * 60 * 24))
})

module.exports = mongoose.model("Order", orderSchema)
