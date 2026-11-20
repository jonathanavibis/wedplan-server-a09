const mongoose = require('mongoose');
const User = require('../models/User');
const Service = require('../models/Service');
const Transaction = require('../models/Transaction');

// GET /api/users/admin/all (Admin: View all users with search and filter)
const getAllUsersAdmin = async (req, res) => {
  try {
    const { search, role } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'All') {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Get all users admin error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/users/admin/:id/toggle-block (Admin: Block or Unblock user)
const toggleBlockUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Invalid user ID.' });
    }

    // Prevent admin from blocking themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Security protection: You cannot block your own admin account.',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} has been ${user.isBlocked ? 'blocked' : 'unblocked'} successfully.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    console.error('Toggle block user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/admin/stats (Admin: Platform overview stats)
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVendors = await User.countDocuments({ role: 'Vendor' });
    const totalCustomers = await User.countDocuments({ role: 'Customer' });
    const totalServices = await Service.countDocuments();
    const pendingServices = await Service.countDocuments({ status: 'Pending' });
    const approvedServices = await Service.countDocuments({ status: 'Approved' });
    const totalTransactions = await Transaction.countDocuments();

    // Calculate total revenue
    const revenueAgg = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalVendors,
        totalCustomers,
        totalServices,
        pendingServices,
        approvedServices,
        totalTransactions,
        totalRevenue,
      },
      totalUsers,
      totalVendors,
      totalCustomers,
      totalServices,
      pendingServices,
      approvedServices,
      totalTransactions,
      totalRevenue,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllUsersAdmin,
  toggleBlockUser,
  getAdminStats,
};
