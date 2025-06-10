const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()

const Client = require("../models/Client")
const Partner = require("../models/Partner")
const Admin = require("../models/Admin")
const Order = require("../models/Order")

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/pixisphere", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const seedData = async () => {
  try {
    console.log("🌱 Starting database seeding...")

    // Clear existing data
    await Promise.all([Client.deleteMany({}), Partner.deleteMany({}), Admin.deleteMany({}), Order.deleteMany({})])

    console.log("🗑️  Cleared existing data")

    // Create sample clients
    const clients = await Client.create([
      {
        username: "john_doe",
        email: "john@example.com",
        password: "password123",
        phoneNo: "+1234567890",
        address: {
          city: "New York",
          state: "NY",
          country: "USA",
        },
        currentPlan: {
          planType: "premium",
        },
      },
      {
        username: "jane_smith",
        email: "jane@example.com",
        password: "password123",
        phoneNo: "+1234567891",
        address: {
          city: "Los Angeles",
          state: "CA",
          country: "USA",
        },
      },
    ])

    console.log("👥 Created sample clients")

    // Create sample partners
    const partners = await Partner.create([
      {
        username: "photo_pro",
        email: "photographer@example.com",
        password: "password123",
        companyName: "Pro Photography Studio",
        phoneNo: "+1234567892",
        shootType: ["wedding", "portrait", "event"],
        partnerType: "company",
        pricePerDay: 15000,
        yearsOfExperience: 5,
        verified: true,
        locations: [
          {
            city: "Mumbai",
            state: "Maharashtra",
            country: "India",
          },
        ],
        ratings: {
          average: 4.5,
          totalReviews: 25,
        },
      },
      {
        username: "creative_lens",
        email: "creative@example.com",
        password: "password123",
        companyName: "Creative Lens Photography",
        phoneNo: "+1234567893",
        shootType: ["fashion", "commercial", "product"],
        partnerType: "individual",
        pricePerDay: 20000,
        yearsOfExperience: 8,
        verified: true,
        locations: [
          {
            city: "Delhi",
            state: "Delhi",
            country: "India",
          },
        ],
        ratings: {
          average: 4.8,
          totalReviews: 42,
        },
      },
    ])

    console.log("📸 Created sample partners")

    // Create sample admin
    const admin = await Admin.create({
      username: "admin",
      email: "admin@pixisphere.com",
      password: "admin123",
      phoneNo: "+1234567894",
      userType: "SuperAdmin",
      permissions: [
        {
          module: "users",
          actions: ["create", "read", "update", "delete"],
        },
        {
          module: "partners",
          actions: ["create", "read", "update", "delete", "approve"],
        },
        {
          module: "orders",
          actions: ["create", "read", "update", "delete"],
        },
      ],
    })

    console.log("👨‍💼 Created admin user")

    // Create sample orders
    const orders = await Order.create([
      {
        orderName: "Wedding Photography Package",
        clientId: clients[0]._id,
        partnerId: partners[0]._id,
        eventDateTime: new Date("2024-06-15T10:00:00Z"),
        pricing: {
          basePrice: 25000,
          totalAmount: 25000,
        },
        status: "confirmed",
        eventDetails: {
          eventType: "wedding",
          eventName: "John & Sarah's Wedding",
        },
        location: {
          venue: "Grand Ballroom",
          address: {
            city: "Mumbai",
            state: "Maharashtra",
            country: "India",
          },
        },
      },
      {
        orderName: "Corporate Event Photography",
        clientId: clients[1]._id,
        partnerId: partners[1]._id,
        eventDateTime: new Date("2024-07-20T14:00:00Z"),
        pricing: {
          basePrice: 15000,
          totalAmount: 15000,
        },
        status: "completed",
        eventDetails: {
          eventType: "corporate",
          eventName: "Annual Company Meeting",
        },
        location: {
          venue: "Business Center",
          address: {
            city: "Delhi",
            state: "Delhi",
            country: "India",
          },
        },
      },
    ])

    console.log("📋 Created sample orders")

    console.log("✅ Database seeding completed successfully!")
    console.log("\n📊 Summary:")
    console.log(`- Clients: ${clients.length}`)
    console.log(`- Partners: ${partners.length}`)
    console.log(`- Admins: 1`)
    console.log(`- Orders: ${orders.length}`)

    console.log("\n🔑 Login Credentials:")
    console.log("Client: john@example.com / password123")
    console.log("Partner: photographer@example.com / password123")
    console.log("Admin: admin@pixisphere.com / admin123")
  } catch (error) {
    console.error("❌ Error seeding database:", error)
  } finally {
    mongoose.connection.close()
  }
}

seedData()
