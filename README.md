# WedPlan — Backend Server API

**Live Server API:** [https://wedplan-server-a09.vercel.app](https://wedplan-server-a09.vercel.app)  
**Live Frontend Application:** [https://wedplan-a09.vercel.app](https://wedplan-a09.vercel.app)  
**Backend Repository:** [https://github.com/jonathanavibis/wedplan-server-a09](https://github.com/jonathanavibis/wedplan-server-a09)  
**Frontend Repository:** [https://github.com/jonathanavibis/wedplan-a09](https://github.com/jonathanavibis/wedplan-a09)  

---

## 💍 Overview

The **WedPlan Backend API** is a robust, role-based RESTful service built with **Node.js**, **Express.js**, **MongoDB Atlas**, **Mongoose ODM**, **JWT Authentication**, and **Stripe Payments**. It serves as the business logic, security, and data persistence backbone of the WedPlan wedding planning platform.

---

## ✨ Core Features & Server Architecture

- **Role-Based Access Control (RBAC):** Strict middleware guards verifying `Admin`, `Vendor`, and `Customer` tokens on all private endpoints.
- **Catalog & Service Lifecycle:**
  - Public search, category filtering, location queries, and price sorting.
  - Automated free tier enforcement: vendors on the free plan are limited to 3 active services.
  - Admin approval workflow: new vendor listings enter a `Pending` state until reviewed.
- **Booking State Machine:**
  - Customer booking request submission with date and venue metadata.
  - Prevention of duplicate bookings for the same service on the same date.
  - Self-cancellation for pending customer requests.
  - Vendor acceptance/rejection flow, immutable once finalized.
  - Ownership protection: vendors cannot book their own services.
- **Stripe Checkout & Financial Management:**
  - Dynamic checkout session generation for vendor premium upgrades ($49.00 USD) and customer VIP passes ($29.00 USD).
  - Secure webhook listener (`/api/transactions/webhook`) verifying raw body Stripe signatures.
  - Instantaneous session verification (`/api/transactions/verify-session`) with automated session-to-user linking.
- **User Governance & Moderation:**
  - Real-time platform KPI statistics aggregation for administrators.
  - User moderation: instant block and unblock controls with live token revocation.
- **Password Security & Management:**
  - Secure bcrypt password hashing with 10 salt rounds.
  - Dedicated `/api/auth/change-password` endpoint verifying old password before saving new credentials.

---

## 🛠️ Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js (v5)
- **Database:** MongoDB Atlas with Mongoose ODM
- **Authentication:** JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Payment Processing:** Stripe Node SDK (`stripe`)
- **File Uploads:** Multer & Axios (ImgBB Proxy)
- **Deployment:** Vercel Serverless Functions (`@vercel/node`)

---

## 📡 Core API Endpoints

### Authentication & Profile (`/api/auth`)
- `POST /api/auth/register` — Register a new Customer or Vendor account (Admin cannot be created publicly)
- `POST /api/auth/login` — Authenticate credentials and issue JWT token
- `POST /api/auth/google` — Synchronize Google OAuth user accounts
- `POST /api/auth/github` — Synchronize GitHub OAuth user accounts
- `GET /api/auth/me` — Retrieve authenticated user profile (Protected)
- `PUT /api/auth/profile` — Update user profile information (Protected)
- `PUT /api/auth/change-password` — Change password with old password, new password, and confirm password (Protected)

### Services & Catalog (`/api/services`)
- `GET /api/services` — Public catalog search with filtering, sorting, and pagination
- `GET /api/services/featured` — Homepage curated featured services
- `GET /api/services/:id` — Detailed service package information
- `GET /api/services/vendor/my-services` — Vendor's own portfolio listings (Vendor only)
- `POST /api/services` — Publish a new service listing (Vendor only, enforces 3-service free limit)
- `PUT /api/services/:id` — Update service listing details (Owner only)
- `DELETE /api/services/:id` — Remove service listing (Owner or Admin)
- `GET /api/services/admin/all` — Full catalog review queue (Admin only)
- `PATCH /api/services/admin/:id/status` — Approve or reject service submission (Admin only)

### Bookings (`/api/bookings`)
- `POST /api/bookings` — Submit wedding service booking request (Customer only)
- `GET /api/bookings/customer/my-bookings` — View customer's booking itinerary (Customer only)
- `PATCH /api/bookings/:id/cancel` — Cancel pending booking request (Customer only)
- `GET /api/bookings/vendor/requests` — View incoming booking requests (Vendor only)
- `PATCH /api/bookings/:id/status` — Accept or reject customer request (Vendor only)

### Transactions & Subscriptions (`/api/transactions`)
- `POST /api/transactions/create-checkout-session` — Generate Stripe Checkout Session (Vendor & Customer)
- `POST /api/transactions/verify-session` — Verify Stripe checkout session and activate plan
- `POST /api/transactions/webhook` — Stripe webhook receiver for asynchronous payment completion
- `GET /api/transactions/my-transactions` — Vendor transaction history (Vendor only)
- `GET /api/transactions/admin/all` — Platform-wide financial ledger (Admin only)

### Administration (`/api/users`)
- `GET /api/users/admin/all` — Paginated user directory with search and role filters (Admin only)
- `PATCH /api/users/admin/:id/toggle-block` — Block or unblock a user account (Admin only)
- `GET /api/users/admin/stats` — Real-time platform KPI statistics (Admin only)

---

## 🔑 Test & Evaluation Credentials

| Role | Email | Password | Access / Scope |
|---|---|---|---|
| **Admin** | `admin@wedplan.com` | `Admin@123456` | Full platform control, service reviews, user moderation, financial ledger |
| **Vendor** | `vendor@wedplan.com` | `Vendor@123456` | Service management, booking requests, 3-service free limit, Stripe upgrade |
| **Customer** | `customer@wedplan.com` | `Customer@123456` | Package browsing, booking submissions, booking cancellation, VIP Concierge |
