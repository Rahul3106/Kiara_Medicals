import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { verifyToken } from '../auth/auth.middleware.js';
import { uploadInvoice, uploadPrescription } from '../middleware/upload.middleware.js';
import { uploadFile } from '../services/storage.service.js';
import { STORAGE_CONFIG } from '../config/storage.config.js';
import { AppError } from '../errors/AppError.js';

const router = Router();

// Upload Invoice Document (Protected)
router.post('/invoice', verifyToken, (req, res, next) => {
  uploadInvoice(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(new AppError('No file uploaded', 400, 'NO_FILE'));

    try {
      const result = await uploadFile({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        folder: 'invoices',
      });

      res.status(201).json({
        success: true,
        message: 'Invoice scan uploaded successfully',
        data: result,
      });
    } catch (uploadError) {
      next(uploadError);
    }
  });
});

// Upload Patient Prescription (Protected)
router.post('/prescription', verifyToken, (req, res, next) => {
  uploadPrescription(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(new AppError('No file uploaded', 400, 'NO_FILE'));

    try {
      const result = await uploadFile({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        folder: 'prescriptions',
      });

      res.status(201).json({
        success: true,
        message: 'Prescription uploaded successfully',
        data: result,
      });
    } catch (uploadError) {
      next(uploadError);
    }
  });
});

// Serve Local Uploads (Static fallback handler)
router.get('/files/*', (req, res, next) => {
  const filePath = req.params[0];
  const fullPath = path.resolve(process.cwd(), STORAGE_CONFIG.LOCAL.UPLOAD_DIR, filePath);

  // Security: prevent directory traversal
  const resolvedBase = path.resolve(process.cwd(), STORAGE_CONFIG.LOCAL.UPLOAD_DIR);
  if (!fullPath.startsWith(resolvedBase)) {
    return next(new AppError('Access denied', 403, 'FORBIDDEN'));
  }

  if (!fs.existsSync(fullPath)) {
    return next(new AppError('File not found', 404, 'NOT_FOUND'));
  }

  res.sendFile(fullPath);
});

export default router;
