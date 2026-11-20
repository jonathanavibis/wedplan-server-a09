const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleAuthSync,
  githubAuthSync,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', register);
router.get('/register', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'WedPlan Auth Register Endpoint is active. Please submit name, email, password, and role via POST request.',
    frontendRegisterUrl: `${process.env.CLIENT_URL || 'https://wedplan-a09.vercel.app'}/register`,
  });
});

router.post('/login', login);
router.get('/login', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'WedPlan Auth Login Endpoint is active. Please submit email and password via POST request to authenticate.',
    frontendLoginUrl: `${process.env.CLIENT_URL || 'https://wedplan-a09.vercel.app'}/login`,
  });
});
router.post('/google', googleAuthSync);
router.post('/github', githubAuthSync);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);

module.exports = router;
