import Tesseract from 'tesseract.js';
import { logger } from '../config/logger.js';

/**
 * Pharmacy Invoice OCR Service
 * Uses tesseract.js (100% local, zero cloud cost) to extract structured
 * fields from scanned distributor bills / purchase invoices.
 *
 * Extracts: batch numbers, expiry dates, HSN codes, invoice numbers, amounts
 */

// Common Indian pharmaceutical invoice regex patterns
const PATTERNS = {
  // Batch numbers: alphanumeric 4-15 chars, often with hyphens
  batchNumber: /\b(?:batch\s*(?:no\.?|#|number)?[:\s]*)?([A-Z0-9][A-Z0-9\-]{3,14})\b/gi,
  // Expiry dates: MM/YY, MM/YYYY, MMM-YY, MMM-YYYY, MM-YYYY
  expiryDate: /\b(?:exp(?:iry)?\.?\s*(?:date)?[:\s]*)?(\d{1,2}[\/-]\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\-\/]\d{2,4})\b/gi,
  // Manufacturing dates
  mfgDate: /\b(?:mfg\.?\s*(?:date)?[:\s]*)(\d{1,2}[\/-]\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\-\/]\d{2,4})\b/gi,
  // HSN codes: 4 or 8 digit numbers
  hsnCode: /\b(?:hsn\s*(?:code)?[:\s]*)?(\d{4}(?:\d{4})?)\b/gi,
  // Invoice number patterns
  invoiceNumber: /\b(?:inv(?:oice)?\.?\s*(?:no\.?|#|number)?[:\s]*)([A-Z0-9\-\/]{4,20})\b/gi,
  // GST number (15 char Indian GSTIN)
  gstin: /\b(\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z0-9])\b/g,
  // Amounts with rupee symbol or decimal values
  amount: /(?:₹|rs\.?|inr)\s*([\d,]+\.?\d{0,2})/gi,
  // Quantity patterns
  quantity: /\b(?:qty\.?|quantity)[:\s]*(\d+)\b/gi,
  // MRP patterns
  mrp: /\b(?:mrp|m\.r\.p\.?)[:\s]*(?:₹|rs\.?|inr)?\s*([\d,]+\.?\d{0,2})\b/gi,
  // Drug License number
  drugLicense: /\b(?:d\.?l\.?\s*(?:no\.?)?|drug\s*lic(?:ense|ence)?\.?\s*(?:no\.?)?)[:\s]*([A-Z0-9\-\/]+)\b/gi,
};

/**
 * Parse amount string to number
 */
const parseAmount = (str) => {
  if (!str) return 0;
  return parseFloat(str.replace(/,/g, '')) || 0;
};

/**
 * Deduplicate and clean extracted values
 */
const dedupe = (arr) => [...new Set(arr.map((s) => s.trim().toUpperCase()))];

/**
 * Extract structured pharmaceutical data from OCR text
 */
const extractFieldsFromText = (rawText) => {
  const text = rawText.replace(/\r\n/g, '\n');

  const batchNumbers = [];
  const expiryDates = [];
  const mfgDates = [];
  const hsnCodes = [];
  const invoiceNumbers = [];
  const gstins = [];
  const amounts = [];
  const quantities = [];
  const mrps = [];
  const drugLicenses = [];

  let match;

  // Extract batch numbers
  while ((match = PATTERNS.batchNumber.exec(text)) !== null) {
    const val = match[1];
    // Filter out likely false positives (pure numbers under 5 digits, common words)
    if (val.length >= 4 && !/^\d{1,4}$/.test(val) && !/^(THE|AND|FOR|FROM|WITH|DATE|BILL|ITEM|TOTAL|AMOUNT)$/i.test(val)) {
      batchNumbers.push(val);
    }
  }

  while ((match = PATTERNS.expiryDate.exec(text)) !== null) expiryDates.push(match[1]);
  while ((match = PATTERNS.mfgDate.exec(text)) !== null) mfgDates.push(match[1]);
  while ((match = PATTERNS.hsnCode.exec(text)) !== null) hsnCodes.push(match[1]);
  while ((match = PATTERNS.invoiceNumber.exec(text)) !== null) invoiceNumbers.push(match[1]);
  while ((match = PATTERNS.gstin.exec(text)) !== null) gstins.push(match[1]);
  while ((match = PATTERNS.amount.exec(text)) !== null) amounts.push(parseAmount(match[1]));
  while ((match = PATTERNS.quantity.exec(text)) !== null) quantities.push(parseInt(match[1], 10));
  while ((match = PATTERNS.mrp.exec(text)) !== null) mrps.push(parseAmount(match[1]));
  while ((match = PATTERNS.drugLicense.exec(text)) !== null) drugLicenses.push(match[1]);

  return {
    batchNumbers: dedupe(batchNumbers).slice(0, 20),
    expiryDates: dedupe(expiryDates).slice(0, 20),
    mfgDates: dedupe(mfgDates).slice(0, 20),
    hsnCodes: dedupe(hsnCodes).slice(0, 10),
    invoiceNumbers: dedupe(invoiceNumbers).slice(0, 5),
    gstins: dedupe(gstins).slice(0, 5),
    amounts: amounts.filter((a) => a > 0).slice(0, 30),
    quantities: quantities.slice(0, 30),
    mrps: mrps.filter((m) => m > 0).slice(0, 30),
    drugLicenses: dedupe(drugLicenses).slice(0, 5),
  };
};

/**
 * Run OCR on an image buffer and return structured pharmaceutical data
 * @param {Buffer} imageBuffer - The image file buffer (JPEG, PNG, PDF page)
 * @param {string} [language='eng'] - Tesseract language pack
 * @returns {Promise<{ rawText: string, confidence: number, fields: Object }>}
 */
export const extractInvoiceData = async (imageBuffer, language = 'eng') => {
  const startTime = Date.now();

  logger.info({ language, bufferSize: imageBuffer.length }, 'Starting OCR extraction on invoice scan');

  try {
    const { data } = await Tesseract.recognize(imageBuffer, language, {
      logger: (info) => {
        if (info.status === 'recognizing text') {
          logger.debug({ progress: Math.round(info.progress * 100) + '%' }, 'OCR progress');
        }
      },
    });

    const rawText = data.text || '';
    const confidence = data.confidence || 0;
    const fields = extractFieldsFromText(rawText);

    const elapsed = Date.now() - startTime;

    logger.info(
      {
        confidence: confidence.toFixed(1) + '%',
        elapsedMs: elapsed,
        batchesFound: fields.batchNumbers.length,
        expiryDatesFound: fields.expiryDates.length,
        hsnCodesFound: fields.hsnCodes.length,
        invoiceNumbersFound: fields.invoiceNumbers.length,
      },
      'OCR extraction completed'
    );

    return {
      rawText,
      confidence,
      fields,
      processingTimeMs: elapsed,
    };
  } catch (err) {
    logger.error({ err }, 'OCR extraction failed');
    throw err;
  }
};
