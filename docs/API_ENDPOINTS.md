# WedPlan API Endpoint Reference

## Base URL
- Local: `http://localhost:5000/api`
- Production: `https://wedplan-a09-server.vercel.app/api`

## Authentication
- `POST /auth/register` — Register customer or vendor account
- `POST /auth/login` — Sign in and receive JWT token
- `POST /auth/google` — Social authentication synchronization
- `GET /auth/me` — Retrieve current authenticated user profile
- `PUT /auth/profile` — Update user name, business name, or password

## Services
- `GET /services` — Public catalog with search, category, location, and price sorting
- `GET /services/featured` — Curated homepage featured services
- `GET /services/:id` — Single service package details
- `GET /services/vendor/my-services` — Vendor portfolio listings
- `POST /services` — Create wedding service (Enforces 3-item limit on Free Plan)
- `PUT /services/:id` — Update wedding service listing
- `DELETE /services/:id` — Delete wedding service listing
- `GET /services/admin/all` — Admin service review list
- `PATCH /services/admin/:id/status` — Approve or reject submitted service

## Bookings
- `POST /bookings` — Submit customer booking request
- `GET /bookings/customer/my-bookings` — Customer booking history
- `PATCH /bookings/:id/cancel` — Cancel pending booking request
- `GET /bookings/vendor/requests` — Incoming requests for vendor services
- `PATCH /bookings/:id/status` — Vendor decision (Accepted or Rejected)

## Transactions & Subscriptions
- `POST /transactions/create-checkout-session` — Generate Stripe Checkout Session
- `POST /transactions/verify-session` — Secure server-side payment verification
- `POST /transactions/webhook` — Stripe Webhook listener
- `GET /transactions/my-transactions` — Vendor billing statement
- `GET /transactions/admin/all` — Administrator transaction audit ledger

## Users & Administration
- `GET /users/admin/all` — User registry with search and role filters
- `PATCH /users/admin/:id/toggle-block` — Suspend or reactivate user access
- `GET /users/admin/stats` — High-level platform KPIs
