# Pixisphere API Documentation

A comprehensive REST API for the Pixisphere photography booking platform built with Express.js and MongoDB.

## 🚀 Features

- **User Management**: Clients, Partners, and Admins with role-based access
- **Advanced Filtering**: Search and filter by multiple criteria
- **Authentication**: JWT-based authentication system
- **File Uploads**: Profile pictures, portfolios, and documents
- **Real-time Analytics**: Dashboard with business insights
- **Comprehensive Validation**: Input validation and error handling
- **Security**: Rate limiting, CORS, and data sanitization

## 📋 Table of Contents

- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Examples](#examples)

## 🛠 Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Setup Steps

1. **Clone the repository**
\`\`\`bash
git clone <repository-url>
cd pixisphere-api
\`\`\`

2. **Install dependencies**
\`\`\`bash
npm install
\`\`\`

3. **Create environment file**
\`\`\`bash
cp .env.example .env
\`\`\`

4. **Configure environment variables** (see [Environment Setup](#environment-setup))

5. **Start MongoDB** (if running locally)
\`\`\`bash
mongod
\`\`\`

6. **Run the application**
\`\`\`bash
# Development mode
npm run dev

# Production mode
npm start
\`\`\`

The API will be available at `http://localhost:5000`

## ⚙️ Environment Setup

Create a `.env` file in the root directory with the following variables:

\`\`\`env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/pixisphere

# JWT Secret (use a strong, random string)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# File Upload
MAX_FILE_SIZE=50mb
UPLOAD_PATH=./uploads

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Cloud Storage (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment Gateway (Optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
\`\`\`

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

### Getting a Token

1. **Register a new user**
\`\`\`bash
POST /api/auth/register
\`\`\`

2. **Login with existing credentials**
\`\`\`bash
POST /api/auth/login
\`\`\`

Both endpoints return a JWT token that expires in 7 days.

## 📚 API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| GET | `/api/auth/me` | Get current user profile | Yes |

### Client Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/clients` | Get all clients with filtering | Yes |
| GET | `/api/clients/:id` | Get single client | Yes |
| POST | `/api/clients` | Create new client | No |
| PUT | `/api/clients/:id` | Update client | Yes |
| DELETE | `/api/clients/:id` | Delete client | Yes |
| GET | `/api/clients/:id/orders` | Get client's orders | Yes |

### Partner Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/partners` | Get all partners with filtering | No |
| GET | `/api/partners/search` | Advanced partner search | No |
| GET | `/api/partners/:id` | Get single partner | No |
| POST | `/api/partners` | Create new partner | No |
| PUT | `/api/partners/:id` | Update partner | Yes |
| GET | `/api/partners/:id/availability` | Check partner availability | No |

### Order Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/orders` | Get all orders with filtering | Yes |
| GET | `/api/orders/:id` | Get single order | Yes |
| POST | `/api/orders` | Create new order | Yes |
| PUT | `/api/orders/:id` | Update order | Yes |
| GET | `/api/orders/analytics/dashboard` | Get order analytics | Yes |

### Admin Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admins/dashboard` | Get dashboard data | Yes (Admin) |
| GET | `/api/admins/system-health` | Get system health | Yes (Admin) |
| GET | `/api/admins/analytics` | Get business analytics | Yes (Admin) |

### Utility Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health check |
| GET | `/` | API information |

## 🔍 Query Parameters & Filtering

### Common Parameters

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - Field to sort by
- `sortOrder` - Sort direction (`asc` or `desc`)
- `search` - General search term

### Client Filtering

\`\`\`bash
GET /api/clients?page=1&limit=20&planType=premium&isVerified=true&city=Mumbai
\`\`\`

**Available Filters:**
- `username` - Filter by username
- `email` - Filter by email
- `city` - Filter by city
- `state` - Filter by state
- `planType` - Filter by plan (`free`, `basic`, `premium`, `enterprise`)
- `isActive` - Filter by active status (`true`/`false`)
- `isVerified` - Filter by verification status (`true`/`false`)
- `dateFrom` - Filter by creation date (from)
- `dateTo` - Filter by creation date (to)

### Partner Filtering

\`\`\`bash
GET /api/partners?shootType=wedding&city=Delhi&minRating=4&verified=true
\`\`\`

**Available Filters:**
- `username` - Filter by username
- `companyName` - Filter by company name
- `email` - Filter by email
- `city` - Filter by service city
- `shootType` - Filter by shoot types
- `planType` - Filter by plan type
- `verified` - Filter by verification status
- `isActive` - Filter by active status
- `partnerType` - Filter by partner type (`individual`, `company`, `agency`)
- `minRating` - Minimum rating filter
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `yearsOfExperience` - Minimum years of experience

### Order Filtering

\`\`\`bash
GET /api/orders?status=completed&eventDateFrom=2024-01-01&minAmount=10000
\`\`\`

**Available Filters:**
- `clientId` - Filter by client ID
- `partnerId` - Filter by partner ID
- `status` - Filter by order status
- `orderName` - Filter by order name
- `location` - Filter by event location
- `eventType` - Filter by event type
- `minAmount` - Minimum order amount
- `maxAmount` - Maximum order amount
- `paymentStatus` - Filter by payment status
- `eventDateFrom` - Event date from
- `eventDateTo` - Event date to
- `bookingDateFrom` - Booking date from
- `bookingDateTo` - Booking date to
- `progressMin` - Minimum progress percentage
- `progressMax` - Maximum progress percentage
- `currentStage` - Current order stage

## 📊 Data Models

### Client Model

\`\`\`javascript
{
  username: String,
  password: String, // Encrypted
  profilePic: Object,
  email: String,
  address: Object,
  phoneNo: String,
  clientId: String, // Auto-generated
  userType: "Client",
  favouritePartners: Array,
  orders: Array,
  activities: Array,
  currentPlan: Object,
  inquiries: Array,
  isActive: Boolean,
  isVerified: Boolean,
  lastLogin: Date
}
\`\`\`

### Partner Model

\`\`\`javascript
{
  username: String,
  password: String, // Encrypted
  companyName: String,
  shootType: Array,
  email: String,
  phoneNo: String,
  address: Object,
  documents: Array,
  profilePic: Object,
  banner: Object,
  portfolio: Array,
  yearsOfExperience: Number,
  userType: "Partner",
  partnerId: String, // Auto-generated
  currentPlan: Object,
  availability: Object,
  packages: Array,
  pricePerDay: Number,
  paymentMethods: Array,
  locations: Array,
  partnerType: String,
  specialization: Array,
  ratings: Object,
  verified: Boolean,
  socialMedia: Object,
  reviews: Array,
  // ... more fields
}
\`\`\`

### Order Model

\`\`\`javascript
{
  orderName: String,
  orderId: String, // Auto-generated
  clientId: ObjectId,
  partnerId: ObjectId,
  eventDetails: Object,
  eventDateTime: Date,
  bookingDateTime: Date,
  location: Object,
  pricing: Object,
  progress: Object,
  specialInstructions: String,
  status: String,
  offerings: Array,
  duration: Object,
  payment: Object,
  messages: Array,
  deliverables: Array,
  review: Object
}
\`\`\`

## ❌ Error Handling

The API returns consistent error responses:

\`\`\`javascript
{
  "success": false,
  "message": "Error description",
  "errors": [], // Validation errors (if any)
  "error": "Detailed error message" // In development mode
}
\`\`\`

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (Duplicate data)
- `429` - Too Many Requests (Rate limited)
- `500` - Internal Server Error

## 📝 Examples

### 1. Register a New Client

\`\`\`bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "userType": "Client",
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "phoneNo": "+1234567890",
    "address": {
      "city": "New York",
      "state": "NY",
      "country": "USA"
    }
  }'
\`\`\`

### 2. Login

\`\`\`bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123",
    "userType": "Client"
  }'
\`\`\`

### 3. Search Partners

\`\`\`bash
curl "http://localhost:5000/api/partners/search?location=Mumbai&shootType=wedding&budget=50000"
\`\`\`

### 4. Get Client Orders

\`\`\`bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:5000/api/clients/CLIENT_ID/orders?status=completed&page=1&limit=10"
\`\`\`

### 5. Create an Order

\`\`\`bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "orderName": "Wedding Photography",
    "clientId": "CLIENT_OBJECT_ID",
    "partnerId": "PARTNER_OBJECT_ID",
    "eventDateTime": "2024-06-15T10:00:00Z",
    "pricing": {
      "totalAmount": 25000
    },
    "location": {
      "venue": "Grand Hotel",
      "address": {
        "city": "Mumbai",
        "state": "Maharashtra"
      }
    }
  }'
\`\`\`

### 6. Get Dashboard Analytics

\`\`\`bash
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  "http://localhost:5000/api/admins/dashboard?dateFrom=2024-01-01&dateTo=2024-12-31"
\`\`\`

## 🔧 Development

### Running Tests

\`\`\`bash
npm test
\`\`\`

### Database Seeding

\`\`\`bash
npm run seed
\`\`\`

### API Documentation

The API includes built-in documentation. Visit `/api/docs` when the server is running.

## 🚀 Deployment

### Using Docker

\`\`\`dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
\`\`\`

### Environment Variables for Production

Make sure to set these environment variables in production:

- `NODE_ENV=production`
- `MONGODB_URI` - Your production MongoDB connection string
- `JWT_SECRET` - A strong, unique secret key
- `FRONTEND_URL` - Your frontend application URL

## 📞 Support

For support and questions:

- Create an issue in the repository
- Email: support@pixisphere.com
- Documentation: [API Docs](http://localhost:5000/api/docs)

## 📄 License

This project is licensed under the MIT License.

---

**Happy Coding! 🎉**
