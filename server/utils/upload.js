import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import multer from 'multer';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import { isAllowedImage } from './imageType.js';

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

// The MIME type is only a hint from the browser; uploadImages() checks the
// actual bytes and re-encodes every accepted image before it is stored.
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(String(file.mimetype).toLowerCase())) return cb(null, true);
    const error = new Error('Only JPEG, PNG or WebP images are allowed');
    error.status = 400;
    cb(error);
  },
});

const processingError = (message = 'That image could not be processed. Upload a JPEG, PNG or WebP photo.') => {
  const error = new Error(message);
  error.status = 400;
  return error;
};

// Re-encodes the bitmap through Sharp. This strips EXIF/metadata, rejects
// malformed files, normalises orientation and bounds the stored dimensions.
const normaliseImage = async (buffer, options = {}) => {
  if (!isAllowedImage(buffer)) throw processingError();

  const {
    width = 2000,
    height = 2000,
    fit = 'inside',
    quality = 82,
  } = options;

  try {
    return await sharp(buffer, {
      failOn: 'error',
      limitInputPixels: 40_000_000,
      animated: false,
    })
      .rotate()
      .resize({ width, height, fit, withoutEnlargement: fit === 'inside' })
      .jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toBuffer();
  } catch {
    throw processingError();
  }
};

const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'real-estate/listings', resource_type: 'image', format: 'jpg' },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

const saveLocally = async (buffer) => {
  await fs.promises.mkdir(uploadsDir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.jpg`;
  await fs.promises.writeFile(path.join(uploadsDir, name), buffer);
  return { url: `/uploads/${name}`, publicId: name };
};

// Validates, re-encodes and stores every file. Returns [{ url, publicId }].
// Passing an avatar option resizes to a square profile image.
export const uploadImages = async (files = [], options = {}) => {
  const prepared = await Promise.all(
    files.map(async (file) => {
      const buffer = await normaliseImage(file.buffer, options);
      return cloudinaryReady ? uploadToCloudinary(buffer) : saveLocally(buffer);
    })
  );
  return prepared;
};

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
