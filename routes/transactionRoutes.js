const express = require('express');
const router = express.Router();
const {
  createCheckoutSession,
  verifySessionAndActivate,
  handleStripeWebhook,
  getVendorTransactions,
  getAllTransactionsAdmin,
} = require('../controllers/transactionController');
const { verifyToken, optionalVerifyToken, requireVendor, requireAdmin } = require('../middleware/auth');

// Webhook endpoint (Raw body handled in index.js)
router.post('/webhook', handleStripeWebhook);

// Checkout and verification endpoints (Available for both Vendors and Customers)
router.post('/create-checkout-session', verifyToken, createCheckoutSession);
router.post('/verify-session', optionalVerifyToken, verifySessionAndActivate);
router.get('/my-transactions', verifyToken, getVendorTransactions);

// Admin endpoints
router.get('/admin/all', verifyToken, requireAdmin, getAllTransactionsAdmin);

module.exports = router;
