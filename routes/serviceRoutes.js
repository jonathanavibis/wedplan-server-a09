const express = require('express');
const router = express.Router();
const {
  getApprovedServices,
  getFeaturedServices,
  getServiceById,
  getVendorServices,
  createService,
  updateService,
  deleteService,
  getAdminServices,
  updateServiceStatusAdmin,
} = require('../controllers/serviceController');
const { verifyToken, requireVendor, requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/', getApprovedServices);
router.get('/featured', getFeaturedServices);
router.get('/:id', getServiceById);

// Vendor protected routes
router.get('/vendor/my-services', verifyToken, requireVendor, getVendorServices);
router.post('/', verifyToken, requireVendor, createService);
router.put('/:id', verifyToken, updateService); // Ownership verified in controller
router.delete('/:id', verifyToken, deleteService); // Ownership verified in controller

// Admin protected routes
router.get('/admin/all', verifyToken, requireAdmin, getAdminServices);
router.patch('/admin/:id/status', verifyToken, requireAdmin, updateServiceStatusAdmin);

module.exports = router;
