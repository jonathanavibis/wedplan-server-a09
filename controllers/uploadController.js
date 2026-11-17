const axios = require('axios');

// POST /api/upload
// Accepts { image: base64String } or multipart form data
const uploadImage = async (req, res) => {
  try {
    const apiKey = process.env.IMGBB_API_KEY || '6d207e02198a847aa5a0a0333f443b32';

    let base64Image = null;

    if (req.file) {
      base64Image = req.file.buffer.toString('base64');
    } else if (req.body.image) {
      // Remove data URL header if present (e.g. "data:image/jpeg;base64,")
      base64Image = req.body.image.replace(/^data:image\/\w+;base64,/, '');
    }

    if (!base64Image) {
      return res.status(400).json({
        success: false,
        message: 'No image file or base64 data provided.',
      });
    }

    // Call ImgBB API
    const formData = new URLSearchParams();
    formData.append('image', base64Image);

    const response = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 15000,
    });

    if (response.data && response.data.data && response.data.data.url) {
      return res.status(200).json({
        success: true,
        url: response.data.data.url,
        display_url: response.data.data.display_url,
        thumb_url: response.data.data.thumb?.url || response.data.data.url,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve uploaded image URL from ImgBB.',
    });
  } catch (error) {
    console.error('ImgBB upload error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || error.message || 'Image upload failed.',
    });
  }
};

module.exports = {
  uploadImage,
};
