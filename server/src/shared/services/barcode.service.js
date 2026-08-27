import { createCanvas } from 'canvas';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { logger } from '../config/logger.js';

/**
 * Barcode & QR Label Generator for Kiara Medicals
 * Generates printable labels for medicine strips, shelf labels, and rack identification.
 *
 * Standard pharmacy label sizes:
 *   - Strip Label:  50mm x 25mm  (barcode + medicine name + batch + expiry)
 *   - Shelf Label:  70mm x 35mm  (barcode + name + MRP + rack location)
 *   - QR Label:     40mm x 40mm  (QR code encoding JSON metadata)
 */

const DPI = 203; // Standard thermal label printer DPI
const MM_TO_PX = DPI / 25.4;

/**
 * Generate a 1D barcode as a PNG buffer
 * @param {Object} params
 * @param {string} params.value - The barcode value (batch number, medicine ID, etc.)
 * @param {string} [params.format='CODE128'] - Barcode symbology
 * @param {string} [params.text] - Text displayed below the barcode
 * @param {number} [params.widthMm=50] - Label width in mm
 * @param {number} [params.heightMm=25] - Label height in mm
 * @returns {Promise<Buffer>} PNG image buffer
 */
export const generateBarcode = async ({
  value,
  format = 'CODE128',
  text,
  widthMm = 50,
  heightMm = 25,
}) => {
  const width = Math.round(widthMm * MM_TO_PX);
  const height = Math.round(heightMm * MM_TO_PX);

  const canvas = createCanvas(width, height);

  try {
    JsBarcode(canvas, value, {
      format,
      width: 2,
      height: Math.round(height * 0.55),
      displayValue: true,
      text: text || value,
      fontSize: 14,
      textMargin: 4,
      margin: 8,
      background: '#FFFFFF',
      lineColor: '#000000',
    });

    const buffer = canvas.toBuffer('image/png');
    logger.debug({ value, format, size: buffer.length }, 'Generated barcode label');
    return buffer;
  } catch (err) {
    logger.error({ err, value, format }, 'Barcode generation failed');
    throw err;
  }
};

/**
 * Generate a QR code as a PNG buffer
 * @param {Object} params
 * @param {string|Object} params.data - Data to encode (string or object to JSON-encode)
 * @param {number} [params.sizeMm=40] - QR code size in mm
 * @param {string} [params.errorCorrection='M'] - Error correction level (L, M, Q, H)
 * @returns {Promise<Buffer>} PNG image buffer
 */
export const generateQRCode = async ({
  data,
  sizeMm = 40,
  errorCorrection = 'M',
}) => {
  const sizePx = Math.round(sizeMm * MM_TO_PX);
  const payload = typeof data === 'object' ? JSON.stringify(data) : String(data);

  try {
    const buffer = await QRCode.toBuffer(payload, {
      type: 'png',
      width: sizePx,
      margin: 2,
      errorCorrectionLevel: errorCorrection,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    logger.debug({ dataLength: payload.length, sizePx }, 'Generated QR code label');
    return buffer;
  } catch (err) {
    logger.error({ err }, 'QR code generation failed');
    throw err;
  }
};

/**
 * Generate a composite pharmacy strip/shelf label with barcode + text metadata
 * @param {Object} params
 * @param {string} params.medicineName - Medicine brand name
 * @param {string} params.batchNumber - Batch number
 * @param {string} params.expiryDate - Expiry date string (e.g. "03/2027")
 * @param {number} params.mrp - Maximum retail price
 * @param {string} [params.rackLocation] - Rack/shelf location (e.g. "A-12")
 * @param {string} [params.barcodeValue] - Value to encode in barcode (defaults to batchNumber)
 * @param {'strip'|'shelf'} [params.labelType='strip'] - Label size preset
 * @returns {Promise<Buffer>} PNG image buffer
 */
export const generateMedicineLabel = async ({
  medicineName,
  batchNumber,
  expiryDate,
  mrp,
  rackLocation,
  barcodeValue,
  labelType = 'strip',
}) => {
  // Label dimensions
  const dims = labelType === 'shelf'
    ? { w: Math.round(70 * MM_TO_PX), h: Math.round(35 * MM_TO_PX) }
    : { w: Math.round(50 * MM_TO_PX), h: Math.round(30 * MM_TO_PX) };

  const canvas = createCanvas(dims.w, dims.h);
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, dims.w, dims.h);

  // Border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, dims.w - 2, dims.h - 2);

  // Barcode in upper portion
  const barcodeCanvas = createCanvas(dims.w - 16, Math.round(dims.h * 0.45));
  try {
    JsBarcode(barcodeCanvas, barcodeValue || batchNumber, {
      format: 'CODE128',
      width: 1.5,
      height: Math.round(dims.h * 0.3),
      displayValue: false,
      margin: 2,
      background: '#FFFFFF',
      lineColor: '#000000',
    });
    ctx.drawImage(barcodeCanvas, 8, 6);
  } catch {
    // If barcode fails, just show text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(barcodeValue || batchNumber, 8, 24);
  }

  // Text metadata below barcode
  const textY = Math.round(dims.h * 0.52);
  ctx.fillStyle = '#000000';

  // Medicine name (truncated to fit)
  ctx.font = 'bold 13px sans-serif';
  const truncName = medicineName.length > 22 ? medicineName.slice(0, 20) + '…' : medicineName;
  ctx.fillText(truncName, 8, textY);

  // Batch + Expiry line
  ctx.font = '11px monospace';
  ctx.fillText(`B: ${batchNumber}  Exp: ${expiryDate}`, 8, textY + 16);

  // MRP + Rack line
  ctx.font = 'bold 12px sans-serif';
  const mrpText = `MRP: ₹${Number(mrp).toFixed(2)}`;
  const rackText = rackLocation ? `  Rack: ${rackLocation}` : '';
  ctx.fillText(mrpText + rackText, 8, textY + 32);

  const buffer = canvas.toBuffer('image/png');
  logger.debug({ medicineName, batchNumber, labelType, size: buffer.length }, 'Generated medicine label');
  return buffer;
};
