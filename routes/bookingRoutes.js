const express = require('express');
const router = express.Router();
const {
  createBooking,
  getCustomerBookings,
  cancelBooking,
  getVendorBookings,
  updateBookingStatus,
} = require('../controllers/bookingController');
const { verifyToken, requireCustomer, requireVendor } = require('../middleware/auth');

// Customer booking routes
router.post('/', verifyToken, createBooking); // Validates non-admin, non-self booking in controller
router.get('/customer/my-bookings', verifyToken, requireCustomer, getCustomerBookings);
router.patch('/:id/cancel', verifyToken, requireCustomer, cancelBooking);

// Vendor booking routes
router.get('/vendor/requests', verifyToken, requireVendor, getVendorBookings);
router.patch('/:id/status', verifyToken, requireVendor, updateBookingStatus);

module.exports = router;
