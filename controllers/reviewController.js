const Review = require('../models/Review');
const Service = require('../models/Service');

const createReview = async (req, res) => {
  try {
    const { serviceId, rating, comment } = req.body;

    if (!serviceId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide serviceId, rating (1-5), and review comment.',
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    // Check duplicate review
    const existing = await Review.findOne({ serviceId, customerId: req.user._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this wedding service.',
      });
    }

    const review = await Review.create({
      serviceId,
      customerId: req.user._id,
      rating: Number(rating),
      comment: comment.trim(),
    });

    const populated = await Review.findById(review._id).populate('customerId', 'name image');

    res.status(201).json({
      success: true,
      message: 'Review posted successfully!',
      review: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getServiceReviews = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const reviews = await Review.find({ serviceId })
      .populate('customerId', 'name image')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createReview,
  getServiceReviews,
};
