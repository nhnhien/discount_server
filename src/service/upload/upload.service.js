import cloudinary from '../../config/cloudinary.config.js';

const uploadFile = async (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder: 'discount',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(new Error('Upload to Cloudinary failed: ' + error.message));
        } else {
          resolve(result.secure_url);
        }
      }
    );
    stream.end(file.buffer);
  });
};

const deleteFile = async (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(new Error('Delete file fail' + error.message));
      } else {
        resolve(result);
      }
    });
  });
};

export { uploadFile, deleteFile };