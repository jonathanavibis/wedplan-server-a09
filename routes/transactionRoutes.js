const express = require('express');
const router = express.Router();
const {
  createCheckoutSession,
  verifySessionAndActivate,
  handleStripeWebhook,
  getVendorTransactions,
  getAllTransactionsAdmin,
} = require('../controllers/transactionController');
const { verifyToken, requireVendor, requireAdmin } = require('../middleware/auth');

// Webhook endpoint (Raw body handled in index.js)
router.post('/webhook', handleStripeWebhook);

// Vendor endpoints
router.post('/create-checkout-session', verifyToken, requireVendor, createCheckoutSession);
router.post('/verify-session', verifyToken, requireVendor, verifySessionAndActivate);
router.get('/my-transactions', verifyToken, requireVendor, getVendorTransactions);

// Admin endpoints
router.get('/admin/all', verifyToken, requireAdmin, getAllTransactionsAdmin);

module.exports = router;
