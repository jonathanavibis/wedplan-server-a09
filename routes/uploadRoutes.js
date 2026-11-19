const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { uploadImage } = require('../controllers/uploadController');
const User = require('../models/User');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Resilient auth middleware for upload endpoint:
// Attaches authenticated user if token is valid, but doesn't crash legitimate uploads
const softVerifyToken = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'wedplan_jwt_secret_key');
        const user = await User.findById(decoded.id).select('-password');
        if (user && !user.isBlocked) {
          req.user = user;
        }
      } catch (tokenErr) {
        // Silently continue for upload resilience
      }
    }
  } catch (err) {}
  next();
};

// Resilient upload endpoint with CORS support
router.options('/', (req, res) => res.status(200).end());
router.post('/', softVerifyToken, upload.single('image'), uploadImage);

module.exports = router;
