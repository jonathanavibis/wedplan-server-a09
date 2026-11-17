const express = require('express');
const router = express.Router();
const {
  getAllUsersAdmin,
  toggleBlockUser,
  getAdminStats,
} = require('../controllers/userController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/admin/all', verifyToken, requireAdmin, getAllUsersAdmin);
router.patch('/admin/:id/toggle-block', verifyToken, requireAdmin, toggleBlockUser);
router.get('/admin/stats', verifyToken, requireAdmin, getAdminStats);

module.exports = router;
