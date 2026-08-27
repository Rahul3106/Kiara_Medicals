import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { STORAGE_CONFIG } from '../config/storage.config.js';
import { logger } from '../config/logger.js';

let s3Client = null;

// Initialize Cloudflare R2 client if configured
if (STORAGE_CONFIG.DRIVER === 'r2' && STORAGE_CONFIG.R2.ACCOUNT_ID) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${STORAGE_CONFIG.R2.ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: STORAGE_CONFIG.R2.ACCESS_KEY_ID,
      secretAccessKey: STORAGE_CONFIG.R2.SECRET_ACCESS_KEY,
    },
  });
  logger.info({ driver: 'Cloudflare R2', bucket: STORAGE_CONFIG.R2.BUCKET_NAME }, 'Initialized Cloudflare R2 Storage Client');
} else {
  // Ensure local uploads directory exists
  const localDir = path.resolve(process.cwd(), STORAGE_CONFIG.LOCAL.UPLOAD_DIR);
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  logger.info({ driver: 'Local Disk', path: localDir }, 'Initialized Local File Storage Driver');
}

/**
 * Generates an organized storage key: {folder}/YYYY/MM/{uuid}-{sanitizedName}
 */
const generateStorageKey = (folder, originalName) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const ext = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  const uuid = crypto.randomUUID().slice(0, 8);
  return `${folder}/${year}/${month}/${uuid}_${base}${ext}`;
};

/**
 * Uploads a file buffer to Cloudflare R2 or local storage
 * @param {Object} params
 * @param {Buffer} params.buffer - File buffer
 * @param {string} params.originalName - Original filename
 * @param {string} params.mimeType - MIME type (e.g. application/pdf, image/jpeg)
 * @param {string} [params.folder='documents'] - Folder category (invoices, prescriptions, etc.)
 * @returns {Promise<{ key: string, url: string, size: number, mimeType: string }>}
 */
export const uploadFile = async ({ buffer, originalName, mimeType, folder = 'documents' }) => {
  const key = generateStorageKey(folder, originalName);

  if (s3Client && STORAGE_CONFIG.DRIVER === 'r2') {
    try {
      const command = new PutObjectCommand({
        Bucket: STORAGE_CONFIG.R2.BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      });

      await s3Client.send(command);

      const publicUrl = STORAGE_CONFIG.R2.PUBLIC_DOMAIN
        ? `${STORAGE_CONFIG.R2.PUBLIC_DOMAIN.replace(/\/$/, '')}/${key}`
        : `/api/uploads/r2/${encodeURIComponent(key)}`;

      logger.info({ key, size: buffer.length, mimeType }, 'Uploaded file to Cloudflare R2');

      return {
        key,
        url: publicUrl,
        size: buffer.length,
        mimeType,
      };
    } catch (err) {
      logger.error({ err, key }, 'Failed to upload to Cloudflare R2, falling back to local storage');
    }
  }

  // Local fallback storage
  const localDir = path.resolve(process.cwd(), STORAGE_CONFIG.LOCAL.UPLOAD_DIR);
  const targetPath = path.join(localDir, key);
  const targetSubDir = path.dirname(targetPath);

  if (!fs.existsSync(targetSubDir)) {
    fs.mkdirSync(targetSubDir, { recursive: true });
  }

  fs.writeFileSync(targetPath, buffer);
  const localUrl = `/api/uploads/files/${key}`;

  logger.info({ key, size: buffer.length }, 'Saved file to local storage');

  return {
    key,
    url: localUrl,
    size: buffer.length,
    mimeType,
  };
};

/**
 * Generates a presigned download URL for private files
 * @param {string} key - Storage object key
 * @param {number} [expiresIn=3600] - Expiry in seconds (default 1 hour)
 * @returns {Promise<string>}
 */
export const getSignedDownloadUrl = async (key, expiresIn = 3600) => {
  if (s3Client && STORAGE_CONFIG.DRIVER === 'r2') {
    try {
      const command = new GetObjectCommand({
        Bucket: STORAGE_CONFIG.R2.BUCKET_NAME,
        Key: key,
      });
      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (err) {
      logger.error({ err, key }, 'Failed to generate signed URL for Cloudflare R2 object');
    }
  }

  // For local files, return local endpoint
  return `/api/uploads/files/${key}`;
};

/**
 * Deletes a file from storage
 * @param {string} key
 */
export const deleteFile = async (key) => {
  if (s3Client && STORAGE_CONFIG.DRIVER === 'r2') {
    try {
      const command = new DeleteObjectCommand({
        Bucket: STORAGE_CONFIG.R2.BUCKET_NAME,
        Key: key,
      });
      await s3Client.send(command);
      logger.info({ key }, 'Deleted file from Cloudflare R2');
      return true;
    } catch (err) {
      logger.error({ err, key }, 'Failed to delete file from Cloudflare R2');
    }
  }

  const localFile = path.resolve(process.cwd(), STORAGE_CONFIG.LOCAL.UPLOAD_DIR, key);
  if (fs.existsSync(localFile)) {
    fs.unlinkSync(localFile);
    logger.info({ key }, 'Deleted local file');
    return true;
  }
  return false;
};
