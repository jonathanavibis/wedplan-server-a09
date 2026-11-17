const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleAuthSync,
  githubAuthSync,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuthSync);
router.post('/github', githubAuthSync);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
