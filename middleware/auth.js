const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token & check if user is blocked or nonexistent
const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authorization token provided.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'wedplan_jwt_secret_key');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked by administrator. Please contact support.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please sign in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.',
    });
  }
};

// Check if authenticated user is an Admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Admin privileges required.',
    });
  }
  next();
};

// Check if authenticated user is a Vendor
const requireVendor = (req, res, next) => {
  if (!req.user || req.user.role !== 'Vendor') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Vendor privileges required.',
    });
  }
  next();
};

// Check if authenticated user is a Customer
const requireCustomer = (req, res, next) => {
  if (!req.user || req.user.role !== 'Customer') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Customer privileges required.',
    });
  }
  next();
};

// Allow access if user is either Admin or the resource owner
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Requires one of roles: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireVendor,
  requireCustomer,
  requireRole,
};
