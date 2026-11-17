const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventDate: {
      type: String,
      required: [true, 'Event date is required'],
    },
    eventLocation: {
      type: String,
      required: [true, 'Event location is required'],
      trim: true,
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate active booking requests for same service and event date from same customer
bookingSchema.index({ serviceId: 1, customerId: 1, eventDate: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
