const mongoose = require('mongoose');
const Service = require('../models/Service');
const User = require('../models/User');

// GET /api/services (Public: approved and active only)
const getApprovedServices = async (req, res) => {
  try {
    const { search, category, location, minPrice, maxPrice, sort, limit, page } = req.query;

    const query = {
      status: 'Approved',
      isActive: true,
    };

    if (search) {
      query.$or = [
        { serviceName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price-asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price-desc') {
      sortOption = { price: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    const pageSize = limit ? Number(limit) : 20;
    const pageNum = page ? Number(page) : 1;
    const skip = (pageNum - 1) * pageSize;

    const total = await Service.countDocuments(query);
    const services = await Service.find(query)
      .populate('vendorId', 'name email image businessName subscriptionPlan')
      .sort(sortOption)
      .skip(skip)
      .limit(pageSize);

    res.status(200).json({
      success: true,
      count: services.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
      services,
    });
  } catch (error) {
    console.error('Get approved services error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/services/featured (Homepage: at least 6 approved services)
const getFeaturedServices = async (req, res) => {
  try {
    const services = await Service.find({ status: 'Approved', isActive: true })
      .populate('vendorId', 'name email image businessName subscriptionPlan')
      .sort({ createdAt: -1 })
      .limit(8);

    res.status(200).json({
      success: true,
      services,
    });
  } catch (error) {
    console.error('Get featured services error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/services/:id (Public: Get single service details)
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Invalid service ID format. Service not found.',
      });
    }

    const service = await Service.findById(id).populate(
      'vendorId',
      'name email image businessName subscriptionPlan'
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Wedding service not found.',
      });
    }

    res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    console.error('Get service by id error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== VENDOR CONTROLLERS ====================

// GET /api/services/vendor/my-services (Vendor: Get own services)
const getVendorServices = async (req, res) => {
  try {
    const services = await Service.find({ vendorId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    console.error('Get vendor services error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/services (Vendor: Add new service)
const createService = async (req, res) => {
  try {
    const { serviceName, category, description, price, location, images } = req.body;

    if (!serviceName || !category || !description || price === undefined || !location || !images || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: serviceName, category, description, price, location, images.',
      });
    }

    // Check Free Plan limitation: max 3 active services
    const user = await User.findById(req.user._id);
    const isPremium = user.subscriptionPlan === 'premium';

    if (!isPremium) {
      const activeCount = await Service.countDocuments({
        vendorId: req.user._id,
        isActive: true,
      });

      if (activeCount >= 3) {
        return res.status(403).json({
          success: false,
          message: 'Free plan limit reached (maximum 3 active services). Please upgrade to Premium for unlimited service publishing.',
          code: 'SUBSCRIPTION_LIMIT_REACHED',
        });
      }
    }

    const newService = await Service.create({
      vendorId: req.user._id,
      serviceName: serviceName.trim(),
      category,
      description,
      price: Number(price),
      location: location.trim(),
      images: Array.isArray(images) ? images : [images],
      status: 'Pending', // Default status: Pending until approved by an admin
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Service submitted successfully and is awaiting admin approval.',
      service: newService,
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/services/:id (Vendor: Update own service)
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceName, category, description, price, location, images, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Invalid service ID.' });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    // Resource ownership verification
    if (service.vendorId.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not own this service listing.',
      });
    }

    if (serviceName) service.serviceName = serviceName.trim();
    if (category) service.category = category;
    if (description) service.description = description;
    if (price !== undefined) service.price = Number(price);
    if (location) service.location = location.trim();
    if (images && images.length > 0) service.images = Array.isArray(images) ? images : [images];
    if (isActive !== undefined) service.isActive = Boolean(isActive);

    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service updated successfully!',
      service,
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/services/:id (Vendor or Admin: Delete service)
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Invalid service ID.' });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    // Resource ownership verification
    if (service.vendorId.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to delete this service.',
      });
    }

    await Service.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully!',
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ADMIN CONTROLLERS ====================

// GET /api/services/admin/all (Admin: View all services)
const getAdminServices = async (req, res) => {
  try {
    const { search, category, status } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { serviceName: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (status && status !== 'All') {
      query.status = status;
    }

    const services = await Service.find(query)
      .populate('vendorId', 'name email image businessName subscriptionPlan')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    console.error('Get admin services error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/services/admin/:id/status (Admin: Approve, Reject, or Update status)
const updateServiceStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Invalid service ID.' });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    if (status) {
      if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be Pending, Approved, or Rejected.',
        });
      }
      service.status = status;
    }

    if (isActive !== undefined) {
      service.isActive = Boolean(isActive);
    }

    await service.save();

    res.status(200).json({
      success: true,
      message: `Service status updated to ${service.status}!`,
      service,
    });
  } catch (error) {
    console.error('Update service status admin error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getApprovedServices,
  getFeaturedServices,
  getServiceById,
  getVendorServices,
  createService,
  updateService,
  deleteService,
  getAdminServices,
  updateServiceStatusAdmin,
};
