import { Router } from 'express';
import { verifyToken } from '../auth/auth.middleware.js';
import { generateBarcode, generateQRCode, generateMedicineLabel } from '../services/barcode.service.js';
import { AppError } from '../errors/AppError.js';

const router = Router();

/**
 * POST /api/labels/barcode
 * Generate a 1D barcode image (CODE128 default)
 * Body: { value, format?, text?, widthMm?, heightMm? }
 */
router.post('/barcode', verifyToken, async (req, res, next) => {
  try {
    const { value, format, text, widthMm, heightMm } = req.body;
    if (!value) return next(new AppError('Barcode value is required', 400, 'MISSING_VALUE'));

    const buffer = await generateBarcode({ value, format, text, widthMm, heightMm });

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="barcode_${value}.png"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  } catch (err) {
    next(new AppError('Barcode generation failed: ' + err.message, 500, 'BARCODE_FAILED'));
  }
});

/**
 * POST /api/labels/qrcode
 * Generate a QR code image
 * Body: { data (string or object), sizeMm?, errorCorrection? }
 */
router.post('/qrcode', verifyToken, async (req, res, next) => {
  try {
    const { data, sizeMm, errorCorrection } = req.body;
    if (!data) return next(new AppError('QR data is required', 400, 'MISSING_DATA'));

    const buffer = await generateQRCode({ data, sizeMm, errorCorrection });

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline; filename="qrcode.png"',
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  } catch (err) {
    next(new AppError('QR code generation failed: ' + err.message, 500, 'QR_FAILED'));
  }
});

/**
 * POST /api/labels/medicine
 * Generate a composite pharmacy label (barcode + name + batch + expiry + MRP + rack)
 * Body: { medicineName, batchNumber, expiryDate, mrp, rackLocation?, barcodeValue?, labelType? }
 */
router.post('/medicine', verifyToken, async (req, res, next) => {
  try {
    const { medicineName, batchNumber, expiryDate, mrp, rackLocation, barcodeValue, labelType } = req.body;

    if (!medicineName || !batchNumber || !expiryDate || mrp == null) {
      return next(new AppError('medicineName, batchNumber, expiryDate, and mrp are required', 400, 'MISSING_FIELDS'));
    }

    const buffer = await generateMedicineLabel({
      medicineName,
      batchNumber,
      expiryDate,
      mrp,
      rackLocation,
      barcodeValue,
      labelType,
    });

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="label_${batchNumber}.png"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  } catch (err) {
    next(new AppError('Medicine label generation failed: ' + err.message, 500, 'LABEL_FAILED'));
  }
});

export default router;
