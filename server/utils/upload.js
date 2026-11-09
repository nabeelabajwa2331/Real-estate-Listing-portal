import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const here = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.join(here, '..', 'uploads');

// Cloudinary is used only when all three values are present. Otherwise we fall
// back to saving files under server/uploads and serving them locally, so the
// whole flow still works during development without an account.
const cloudinaryReady = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryReady) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Keeps the upload in memory so the same middleware works for both backends.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    const error = new Error('Only image files are allowed');
    error.status = 400;
    cb(error);
  },
});

const uploadToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'real-estate/listings', resource_type: 'image' },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(file.buffer);
  });

const saveLocally = async (file) => {
  await fs.promises.mkdir(uploadsDir, { recursive: true });
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  await fs.promises.writeFile(path.join(uploadsDir, name), file.buffer);
  return { url: `/uploads/${name}`, publicId: name };
};

// Uploads every file and returns [{ url, publicId }].
export const uploadImages = (files = []) =>
  Promise.all(files.map((file) => (cloudinaryReady ? uploadToCloudinary(file) : saveLocally(file))));

// Removes one stored image. Safe to call with a missing/invalid image.
export const deleteImage = async (image) => {
  if (!image?.publicId) return;
  try {
    if (cloudinaryReady) {
      await cloudinary.uploader.destroy(image.publicId);
    } else {
      await fs.promises.rm(path.join(uploadsDir, path.basename(image.publicId)), { force: true });
    }
  } catch (err) {
    console.error('Could not delete image:', err.message);
  }
};
