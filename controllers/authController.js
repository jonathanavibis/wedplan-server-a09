const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'wedplan_jwt_secret_key',
    { expiresIn: '7d' }
  );
};

// Register Customer or Vendor
const register = async (req, res) => {
  try {
    const { name, email, password, role, image, businessName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    // Password validation: min 6 chars, 1 uppercase, 1 lowercase
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters and contain at least one uppercase and one lowercase letter.',
      });
    }

    // Role validation: Security check - Admin cannot be created via public registration
    let userRole = 'Customer';
    if (role === 'Vendor') {
      userRole = 'Vendor';
    } else if (role === 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Security violation: Admin accounts cannot be registered publicly.',
      });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole,
      image: image || '',
      businessName: userRole === 'Vendor' ? businessName || `${name}'s Services` : '',
      subscriptionPlan: 'free',
    });

    const token = generateToken(newUser);

    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: userObj,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked by administrator. Access denied.',
      });
    }

    let isMatch = false;
    try {
      if (user.password && user.password.startsWith('$2')) {
        isMatch = await bcrypt.compare(password, user.password);
      }
    } catch {
      isMatch = false;
    }

    // Resilient fallback: If password was directly edited in database as plain text
    if (!isMatch && password === user.password) {
      isMatch = true;
      // Auto-upgrade plain text password in DB to a secure bcrypt hash
      try {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
      } catch (hashErr) {
        console.warn('Could not auto-hash plain password:', hashErr.message);
      }
    }

    // Dual demo credential support (both 1-click and standard assignment passwords match)
    if (!isMatch) {
      const emailLower = email.toLowerCase();
      if (
        (emailLower === 'admin@wedplan.com' && (password === 'wpadmin123' || password === 'Admin@123456')) ||
        (emailLower === 'vendor@wedplan.com' && (password === 'wpvendor123' || password === 'Vendor@123456')) ||
        (emailLower === 'customer@wedplan.com' && (password === 'wpcustomer123' || password === 'Customer@123456'))
      ) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user);

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: userObj,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login.',
    });
  }
};

// Google / Social Auth sync endpoint
const googleAuthSync = async (req, res) => {
  try {
    const { email, name, image, role } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      const assignedRole = role === 'Vendor' ? 'Vendor' : 'Customer';

      user = await User.create({
        name: name || 'Google User',
        email: email.toLowerCase(),
        password: hashedPassword,
        image: image || '',
        role: assignedRole,
        businessName: assignedRole === 'Vendor' ? `${name}'s Studio` : '',
        subscriptionPlan: 'free',
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked by administrator.',
      });
    }

    const token = generateToken(user);
    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      token,
      user: userObj,
    });
  } catch (error) {
    console.error('Google auth sync error:', error);
    res.status(500).json({ success: false, message: 'Google authentication error.' });
  }
};

// GitHub Social Auth sync endpoint
const githubAuthSync = async (req, res) => {
  try {
    const { email, name, image, role } = req.body;

    const userEmail = email ? email.toLowerCase() : `github_${Date.now()}@wedplan.com`;
    let user = await User.findOne({ email: userEmail });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      const assignedRole = role === 'Vendor' ? 'Vendor' : 'Customer';

      user = await User.create({
        name: name || 'GitHub User',
        email: userEmail,
        password: hashedPassword,
        image: image || 'https://avatars.githubusercontent.com/u/9919?s=200&v=4',
        role: assignedRole,
        businessName: assignedRole === 'Vendor' ? `${name || 'GitHub'}'s Studio` : '',
        subscriptionPlan: 'free',
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked by administrator.',
      });
    }

    const token = generateToken(user);
    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      token,
      user: userObj,
    });
  } catch (error) {
    console.error('GitHub auth sync error:', error);
    res.status(500).json({ success: false, message: 'GitHub authentication error.' });
  }
};

// Get current user profile (/me)
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update profile (Name, image, businessName). Cannot change role or subscriptionPlan.
const updateProfile = async (req, res) => {
  try {
    const { name, image, businessName, password } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name.trim();
    if (image !== undefined) user.image = image;
    if (businessName !== undefined && user.role === 'Vendor') {
      user.businessName = businessName.trim();
    }

    if (password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters and contain at least one uppercase and one lowercase letter.',
        });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: userObj,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  googleAuthSync,
  githubAuthSync,
  getMe,
  updateProfile,
};
