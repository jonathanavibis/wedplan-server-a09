// Request payload validation helper for clean error messages
const validateServiceInput = (req, res, next) => {
  const { serviceName, category, description, price, location, images } = req.body;
  const errors = [];

  if (!serviceName || typeof serviceName !== 'string' || serviceName.trim().length < 3) {
    errors.push('Service name must be at least 3 characters.');
  }

  const validCategories = [
    'Photography & Videography',
    'Wedding Venues',
    'Decoration & Florist',
    'Catering Services',
    'Makeup & Styling',
    'Wedding Fashion',
  ];
  if (!category || !validCategories.includes(category)) {
    errors.push(`Category must be one of: ${validCategories.join(', ')}`);
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    errors.push('Description must be at least 10 characters.');
  }

  if (price === undefined || isNaN(price) || Number(price) < 0) {
    errors.push('Price must be a valid positive number.');
  }

  if (!location || typeof location !== 'string' || location.trim().length < 2) {
    errors.push('Location is required.');
  }

  if (!images || !Array.isArray(images) || images.length === 0) {
    errors.push('At least one image URL is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  next();
};

const validateBookingInput = (req, res, next) => {
  const { serviceId, eventDate, eventLocation } = req.body;
  const errors = [];

  if (!serviceId) errors.push('Service ID is required.');
  if (!eventDate) errors.push('Event date is required.');
  if (!eventLocation || eventLocation.trim().length < 2) errors.push('Event location is required.');

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  next();
};

module.exports = {
  validateServiceInput,
  validateBookingInput,
};
