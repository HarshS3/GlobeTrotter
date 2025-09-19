import { v2 as cloudinary } from 'cloudinary';
import { config as appConfig } from '../core/config.js';

// Configure only if credentials present; allows running without Cloudinary in local dev.
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

export function isCloudinaryEnabled() {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

export async function uploadBase64Image(dataUrl, folder = 'globetrotter') {
  if (!isCloudinaryEnabled()) throw new Error('Cloudinary not configured');
  // dataUrl can be full "data:image/...;base64,..." or raw base64; cloudinary.uploader.upload can handle data URI
  const res = await cloudinary.uploader.upload(dataUrl, {
    folder,
    overwrite: true,
    resource_type: 'image'
  });
  return { url: res.secure_url, publicId: res.public_id, width: res.width, height: res.height };
}

export async function uploadBuffer(buffer, filename, folder='globetrotter') {
  if (!isCloudinaryEnabled()) throw new Error('Cloudinary not configured');
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, public_id: filename, resource_type: 'image' }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}