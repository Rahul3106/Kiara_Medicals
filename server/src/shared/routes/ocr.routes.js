import { Router } from 'express';
import { verifyToken } from '../auth/auth.middleware.js';
import { uploadInvoice } from '../middleware/upload.middleware.js';
import { extractInvoiceData } from '../services/ocr.service.js';
import { AppError } from '../errors/AppError.js';

const router = Router();

/**
 * POST /api/ocr/extract-invoice
 * Upload a scanned distributor bill image and extract structured pharmaceutical fields.
 * Returns: batch numbers, expiry dates, HSN codes, invoice numbers, MRPs, quantities, GSTINs
 */
router.post('/extract-invoice', verifyToken, (req, res, next) => {
  uploadInvoice(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(new AppError('No invoice image uploaded', 400, 'NO_FILE'));

    try {
      const result = await extractInvoiceData(req.file.buffer, req.query.lang || 'eng');

      res.json({
        success: true,
        message: `OCR completed in ${result.processingTimeMs}ms with ${result.confidence.toFixed(1)}% confidence`,
        data: {
          confidence: result.confidence,
          processingTimeMs: result.processingTimeMs,
          fields: result.fields,
          rawText: req.query.raw === 'true' ? result.rawText : undefined,
        },
      });
    } catch (ocrError) {
      next(new AppError('OCR processing failed: ' + ocrError.message, 500, 'OCR_FAILED'));
    }
  });
});

export default router;
