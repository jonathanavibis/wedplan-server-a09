const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Service = require('../models/Service');

// POST /api/bookings (Customer: Create a booking request)
const createBooking = async (req, res) => {
  try {
    const { serviceId, eventDate, eventLocation, message } = req.body;

    // Admins cannot submit customer booking requests
    if (req.user.role === 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Administrators cannot submit booking requests.',
      });
    }

    if (!serviceId || !eventDate || !eventLocation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide serviceId, eventDate, and eventLocation.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(404).json({ success: false, message: 'Invalid service ID.' });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    if (service.status !== 'Approved' || !service.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This service is currently unavailable for booking.',
      });
    }

    // Rule: Prevent vendors from booking their own services
    if (service.vendorId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book your own wedding service.',
      });
    }

    // Rule: Prevent duplicate active booking requests for same service and event date
    const duplicate = await Booking.findOne({
      serviceId,
      customerId: req.user._id,
      eventDate,
      status: { $in: ['Pending', 'Accepted'] },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active booking request for this service on this date.',
      });
    }

    const booking = await Booking.create({
      serviceId,
      vendorId: service.vendorId,
      customerId: req.user._id,
      eventDate,
      eventLocation: eventLocation.trim(),
      message: message ? message.trim() : '',
      status: 'Pending',
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('serviceId', 'serviceName category price images location')
      .populate('vendorId', 'name email businessName')
      .populate('customerId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully! The vendor will review it.',
      booking: populatedBooking,
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/bookings/customer/my-bookings (Customer: Get own bookings)
const getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.user._id })
      .populate('serviceId', 'serviceName category price images location')
      .populate('vendorId', 'name email businessName image')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('Get customer bookings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/bookings/:id/cancel (Customer: Cancel own pending booking)
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Invalid booking ID.' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking request not found.' });
    }

    // Customers cannot modify or cancel another customer's bookings
    if (booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not own this booking request.',
      });
    }

    // Rule: Customers cannot cancel an already accepted, rejected, or cancelled booking
    if (booking.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking that is already ${booking.status.toLowerCase()}. Only Pending requests can be cancelled.`,
      });
    }

    booking.status = 'Cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking request has been cancelled.',
      booking,
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/bookings/vendor/requests (Vendor: Get booking requests for vendor's services)
const getVendorBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ vendorId: req.user._id })
      .populate('serviceId', 'serviceName category price images location')
      .populate('customerId', 'name email image')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('Get vendor bookings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/bookings/:id/status (Vendor: Accept or Reject booking)
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Invalid booking ID.' });
    }

    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Vendor can only set status to Accepted or Rejected.',
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking request not found.' });
    }

    // Rule: Vendors cannot modify booking requests belonging to other vendors
    if (booking.vendorId.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not manage this service booking.',
      });
    }

    // Rule: Only pending requests can be accepted or rejected.
    // Once accepted or rejected, a request cannot be processed again.
    if (booking.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `This booking request is already marked as ${booking.status} and cannot be processed again.`,
      });
    }

    booking.status = status;
    await booking.save();

    const updated = await Booking.findById(id)
      .populate('serviceId', 'serviceName category price images location')
      .populate('customerId', 'name email');

    res.status(200).json({
      success: true,
      message: `Booking request has been ${status.toLowerCase()}!`,
      booking: updated,
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBooking,
  getCustomerBookings,
  cancelBooking,
  getVendorBookings,
  updateBookingStatus,
};
