import multer from 'multer';
import { AppError } from '../errors/AppError.js';

// Memory storage keeps file buffers ready for direct streaming to Cloudflare R2
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type: ${file.mimetype}. Allowed types are PDF, JPEG, PNG, and WebP.`,
        400,
        'INVALID_FILE_TYPE'
      ),
      false
    );
  }
};

export const uploadInvoice = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum
    files: 1,
  },
}).single('invoiceScan');

export const uploadPrescription = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum
    files: 1,
  },
}).single('prescription');
