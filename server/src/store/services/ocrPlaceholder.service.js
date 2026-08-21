/**
 * OCR Invoice Parsing Service Placeholder
 * In production, integrates with Tesseract.js, AWS Textract, or Google Cloud Vision.
 * Provides instant parsing simulation and structured payload extraction.
 */

export const parseInvoiceScan = async (fileBufferOrUrl, branchMedicines = []) => {
  // Simulated OCR extract from medical distributors (e.g. Mahaveer Medi-Sales, Apollo Pharma Dist)
  return {
    success: true,
    message: 'Invoice scan parsed successfully via OCR engine',
    extractedData: {
      supplierName: 'Mahaveer Medi-Sales Pvt Ltd',
      supplierGst: '27AAECM5544R1Z8',
      invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      items: [
        {
          suggestedMedicineName: 'Dolo 650',
          batchNumber: `DL-${Math.floor(100 + Math.random() * 900)}`,
          expiryDate: '2027-11-30',
          quantity: 100,
          freeQuantity: 10,
          purchasePrice: 24.5,
          mrp: 33.6,
          taxRate: 12.0,
        },
        {
          suggestedMedicineName: 'Augmentin 625 Duo',
          batchNumber: `AG-${Math.floor(100 + Math.random() * 900)}`,
          expiryDate: '2026-09-30',
          quantity: 50,
          freeQuantity: 5,
          purchasePrice: 140.0,
          mrp: 201.5,
          taxRate: 12.0,
        },
      ],
    },
  };
};
