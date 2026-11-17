const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    serviceName: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Service category is required'],
      enum: [
        'Photography & Videography',
        'Wedding Venues',
        'Decoration & Florist',
        'Catering Services',
        'Makeup & Styling',
        'Wedding Fashion',
      ],
    },
    description: {
      type: String,
      required: [true, 'Service description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Service price is required'],
      min: 0,
    },
    location: {
      type: String,
      required: [true, 'Service location is required'],
      trim: true,
    },
    images: {
      type: [String],
      required: [true, 'At least one service image is required'],
      validate: [val => val.length > 0, 'Must have at least one image'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search & filtering efficiency
serviceSchema.index({ serviceName: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Service', serviceSchema);
