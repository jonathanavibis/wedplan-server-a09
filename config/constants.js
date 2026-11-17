// System constants for WedPlan
const ROLES = Object.freeze({
  ADMIN: 'Admin',
  VENDOR: 'Vendor',
  CUSTOMER: 'Customer',
});

const CATEGORIES = Object.freeze([
  'Photography & Videography',
  'Wedding Venues',
  'Decoration & Florist',
  'Catering Services',
  'Makeup & Styling',
  'Wedding Fashion',
]);

const BOOKING_STATUS = Object.freeze({
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
});

const SERVICE_STATUS = Object.freeze({
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
});

const SUBSCRIPTION_PLANS = Object.freeze({
  FREE: 'free',
  PREMIUM: 'premium',
});

const FREE_TIER_MAX_SERVICES = 3;
const PREMIUM_TIER_PRICE_USD = 49.0;

module.exports = {
  ROLES,
  CATEGORIES,
  BOOKING_STATUS,
  SERVICE_STATUS,
  SUBSCRIPTION_PLANS,
  FREE_TIER_MAX_SERVICES,
  PREMIUM_TIER_PRICE_USD,
};
