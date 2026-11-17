# WedPlan Backend Server — Wedding Planning Platform API

WedPlan Backend is a role-based RESTful API server built with **Express.js**, **MongoDB**, **Mongoose**, **JWT Authentication**, and **Stripe Checkout**, powering the WedPlan wedding planning platform.

---

## 🌟 Important Features

- **Role-Based Access Control (RBAC):** Strict server-side verification for `Admin`, `Vendor`, and `Customer` roles.
- **Service Listings & Catalog Management:**
  - Public search by name, category, and location with price sorting (asc/desc).
  - Admin service approval workflow (`Pending` -> `Approved` / `Rejected`).
  - Free vendor tier limit enforcement: maximum 3 active services.
  - Premium vendor tier: unlimited active services.
- **Booking Request Lifecycle:**
  - Customer booking request submission with duplicate prevention for same service and event date.
  - Customer self-cancellation for pending bookings.
  - Vendor acceptance and rejection state-machine (immutable once finalized).
  - Cross-account protection (vendors cannot book own services; customers cannot alter other users' bookings).
- **Stripe Checkout & Webhook Integration:**
  - Automated Stripe Checkout Session generation for Premium vendor upgrades ($49.00 USD).
  - Secure webhook endpoint (`/api/transactions/webhook`) with raw body signature verification.
  - Immediate server-side session verification endpoint (`/api/transactions/verify-session`).
- **User & Platform Governance:**
  - Admin dashboard analytics: total users, vendors, customers, services, pending approvals, transactions, and gross revenue.
  - User moderation: instant block / unblock capabilities with token re-check.
- **Image Upload Integration:**
  - Integrated ImgBB upload proxy with in-memory buffer handling for service and profile photos.
- **Security Best Practices:**
  - Password hashing via `bcryptjs` (salt rounds: 10).
  - Password strength validation (min 6 characters, uppercase, lowercase).
  - Strict resource ownership verification before update or deletion.
  - Non-forgeable JWT authentication tokens.

---

## 🛠️ Technology Stack

- **Runtime:** Node.js (v20+ / v22 / v26)
- **Framework:** Express.js (v5)
- **Database:** MongoDB Atlas with Mongoose ODM
- **Authentication:** JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Payments:** Stripe SDK (`stripe`)
- **File & Image Processing:** Multer & Axios (ImgBB API)
- **Deployment:** Vercel Serverless Functions (`@vercel/node`)

---

## 🔐 Environment Variables

Create a `.env` file in the root of the server directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/wedplan?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
IMGBB_API_KEY=your_imgbb_api_key
```

---

## 🚀 Installation & Local Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database
Seeds default Admin, Vendors, Customer, 8+ approved wedding services across all categories, bookings, and transactions:
```bash
npm run seed
```

### 3. Run Development Server
```bash
npm run dev
```

The API server will run at: `http://localhost:5000`

---

## 🔑 Default Evaluation Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@wedplan.com` | `Admin@123456` |
| **Free Vendor** | `vendor@wedplan.com` | `Vendor@123456` |
| **Premium Vendor** | `premium@wedplan.com` | `Vendor@123456` |
| **Customer** | `customer@wedplan.com` | `Customer@123456` |

---

## 📡 API Endpoints Overview

### Auth
- `POST /api/auth/register` — Register customer or vendor (Admin cannot be created publicly)
- `POST /api/auth/login` — Sign in with credentials and receive JWT
- `POST /api/auth/google` — Social authentication sync
- `GET /api/auth/me` — Get current user profile (Protected)
- `PUT /api/auth/profile` — Update profile details (Protected)

### Services
- `GET /api/services` — Public catalog (search, filter, sort, paginate)
- `GET /api/services/featured` — Homepage featured services
- `GET /api/services/:id` — Service details
- `GET /api/services/vendor/my-services` — Vendor's own listings (Vendor only)
- `POST /api/services` — Create service with 3-service free tier limit (Vendor only)
- `PUT /api/services/:id` — Update service listing (Owner only)
- `DELETE /api/services/:id` — Delete service listing (Owner or Admin)
- `GET /api/services/admin/all` — View all services for review (Admin only)
- `PATCH /api/services/admin/:id/status` — Approve/Reject service (Admin only)

### Bookings
- `POST /api/bookings` — Submit booking request (Customer only)
- `GET /api/bookings/customer/my-bookings` — Customer bookings (Customer only)
- `PATCH /api/bookings/:id/cancel` — Cancel pending booking (Customer only)
- `GET /api/bookings/vendor/requests` — View booking requests (Vendor only)
- `PATCH /api/bookings/:id/status` — Accept or Reject booking (Vendor only)

### Transactions & Subscriptions
- `POST /api/transactions/create-checkout-session` — Generate Stripe Checkout Session (Vendor only)
- `POST /api/transactions/verify-session` — Verify Stripe payment & activate Premium (Vendor only)
- `POST /api/transactions/webhook` — Stripe webhook listener
- `GET /api/transactions/my-transactions` — Vendor transaction history (Vendor only)
- `GET /api/transactions/admin/all` — Admin transaction ledger (Admin only)

### Users & Administration
- `GET /api/users/admin/all` — User list with role filters & search (Admin only)
- `PATCH /api/users/admin/:id/toggle-block` — Block / unblock user (Admin only)
- `GET /api/users/admin/stats` — Platform KPI statistics (Admin only)

### Uploads
- `POST /api/upload` — Upload images to ImgBB (Protected)
