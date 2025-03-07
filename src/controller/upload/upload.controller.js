import { uploadFile } from '../../service/upload/upload.service.js';

const uploadFileStorage = async (req, res) => {
  if (!req.file) {
    return res.json({
      success: false,
      message: 'No image file uploaded',
    });
  }

  try {
    const imageUrl = await uploadFile(req.file);
    if (!imageUrl) {
      return res.json({
        success: false,
        message: 'Failed to upload image',
      });
    }

    return res.json({
      success: true,
      message: 'Image uploaded successfully',
      url: imageUrl,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

export { uploadFileStorage };