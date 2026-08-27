import crypto from 'crypto';
import { logger } from '../config/logger.js';

/**
 * GST E-Invoicing / IRN (Invoice Reference Number) Service
 *
 * Implements the Indian GST E-Invoice standard for generating
 * IRN-ready payloads per GSTN/NIC specifications.
 *
 * This module:
 *   1. Transforms Kiara Medicals sale invoices into NIC-compliant JSON schema
 *   2. Generates local IRN hash (SHA256 of invoice payload) for offline tracking
 *   3. Provides a hook for submitting to GSP APIs (ClearTax, Masters India, etc.)
 *
 * Integration Flow:
 *   Sale Invoice → buildEInvoicePayload() → GSP API → IRN + QR Code from NIC
 *
 * Note: Actual IRN registration requires a registered GSP (Government Supplier Partner).
 *       This module builds the standardized payload and provides the submission hook.
 */

/**
 * GST E-Invoice document type codes
 */
const DOC_TYPES = {
  REGULAR_INVOICE: 'INV',
  CREDIT_NOTE: 'CRN',
  DEBIT_NOTE: 'DBN',
};

/**
 * Supply type codes
 */
const SUPPLY_TYPES = {
  B2B: 'B2B',       // Business to Business
  B2C: 'B2C',       // Business to Consumer (< ₹2.5L)
  SEZWP: 'SEZWP',   // SEZ with payment
  SEZWOP: 'SEZWOP', // SEZ without payment
  EXPWP: 'EXPWP',   // Export with payment
  EXPWOP: 'EXPWOP', // Export without payment
};

/**
 * Build NIC-compliant E-Invoice JSON payload from a Kiara Medicals sale
 * @param {Object} sale - Full sale object with items, customer, branch
 * @param {Object} branch - Branch details with GST, address
 * @returns {Object} NIC E-Invoice JSON schema payload
 */
export const buildEInvoicePayload = (sale, branch) => {
  const isB2B = sale.customer?.gstNumber && sale.customer.gstNumber.length === 15;
  const saleDate = new Date(sale.saleDate);

  const payload = {
    Version: '1.1',
    TranDtls: {
      TaxSch: 'GST',
      SupTyp: isB2B ? SUPPLY_TYPES.B2B : SUPPLY_TYPES.B2C,
      RegRev: 'N', // Regular (non-reverse) charge
      EcmGstin: null,
      IgstOnIntra: 'N',
    },
    DocDtls: {
      Typ: DOC_TYPES.REGULAR_INVOICE,
      No: sale.billNumber,
      Dt: formatDate(saleDate),
    },
    SellerDtls: {
      Gstin: branch.gstNumber,
      LglNm: branch.name,
      TrdNm: branch.name,
      Addr1: branch.address,
      Loc: branch.city,
      Pin: parseInt(branch.pincode) || 0,
      Stcd: getStateCode(branch.state),
      Ph: branch.phone?.replace(/[^\d]/g, ''),
      Em: branch.email || '',
    },
    BuyerDtls: {
      Gstin: sale.customer?.gstNumber || 'URP', // URP = Unregistered Person
      LglNm: sale.customer?.name || 'Walk-in Customer',
      TrdNm: sale.customer?.name || 'Walk-in Customer',
      Addr1: sale.customer?.address || branch.address,
      Loc: branch.city,
      Pin: parseInt(branch.pincode) || 0,
      Stcd: getStateCode(branch.state),
      Pos: getStateCode(branch.state).toString(), // Place of supply
      Ph: sale.customer?.phone?.replace(/[^\d]/g, '') || '',
      Em: sale.customer?.email || '',
    },
    ItemList: (sale.items || []).map((item, idx) => ({
      SlNo: String(idx + 1),
      PrdDesc: item.medicine?.name || 'Medicine',
      IsServc: 'N',
      HsnCd: item.medicine?.hsnCode || '3004',
      Barcde: item.batchNumber || '',
      Qty: item.quantity,
      FreeQty: 0,
      Unit: 'NOS',
      UnitPrice: Number(item.unitPrice),
      TotAmt: Number(item.quantity) * Number(item.unitPrice),
      Discount: Number(item.discountAmount) || 0,
      PreTaxVal: Number(item.netAmount) - Number(item.cgstAmount || 0) - Number(item.sgstAmount || 0) - Number(item.igstAmount || 0),
      AssAmt: Number(item.netAmount) - Number(item.cgstAmount || 0) - Number(item.sgstAmount || 0) - Number(item.igstAmount || 0),
      GstRt: Number(item.taxRate),
      CgstAmt: Number(item.cgstAmount) || 0,
      SgstAmt: Number(item.sgstAmount) || 0,
      IgstAmt: Number(item.igstAmount) || 0,
      CesRt: 0,
      CesAmt: 0,
      CesNonAdvlAmt: 0,
      StateCesRt: 0,
      StateCesAmt: 0,
      StateCesNonAdvlAmt: 0,
      OthChrg: 0,
      TotItemVal: Number(item.netAmount),
      OrdLineRef: String(idx + 1),
      OrgCntry: 'IN',
      PrdSlNo: item.batchNumber || '',
      BchDtls: {
        Nm: item.batchNumber || '',
        ExpDt: item.expiryDate ? formatDate(new Date(item.expiryDate)) : '',
      },
    })),
    ValDtls: {
      AssVal: Number(sale.subTotal),
      CgstVal: Number(sale.cgstAmount) || 0,
      SgstVal: Number(sale.sgstAmount) || 0,
      IgstVal: Number(sale.igstAmount) || 0,
      CesVal: 0,
      StCesVal: 0,
      Discount: Number(sale.discountAmount) || 0,
      OthChrg: 0,
      RndOffAmt: Number(sale.roundOff) || 0,
      TotInvVal: Number(sale.grandTotal),
    },
  };

  logger.debug(
    { billNumber: sale.billNumber, itemCount: payload.ItemList.length },
    'Built GST E-Invoice payload'
  );

  return payload;
};

/**
 * Generate a local IRN hash for offline tracking
 * (Real IRN is issued by NIC portal after submission via GSP)
 * @param {Object} payload - E-Invoice payload
 * @returns {string} SHA256 hash string
 */
export const generateLocalIRN = (payload) => {
  const canonical = JSON.stringify({
    gstin: payload.SellerDtls.Gstin,
    docType: payload.DocDtls.Typ,
    docNo: payload.DocDtls.No,
    docDate: payload.DocDtls.Dt,
    financialYear: getFinancialYear(payload.DocDtls.Dt),
  });

  return crypto.createHash('sha256').update(canonical).digest('hex');
};

/**
 * Hook for GSP API submission
 * Replace with actual GSP SDK calls when you register with ClearTax / Masters India / Cygnet
 * @param {Object} payload - NIC E-Invoice payload
 * @param {Object} config - GSP API credentials
 * @returns {Promise<Object>} GSP response with IRN, QR code, signed invoice
 */
export const submitToGSP = async (payload, config = {}) => {
  const { apiEndpoint, authToken, gspId } = config;

  if (!apiEndpoint || !authToken) {
    logger.warn('GSP credentials not configured. E-Invoice payload generated but not submitted.');
    return {
      submitted: false,
      localIRN: generateLocalIRN(payload),
      payload,
      message: 'GSP API not configured. Set GSP_API_ENDPOINT and GSP_AUTH_TOKEN in .env to enable live submission.',
    };
  }

  // Placeholder for actual GSP API call
  // In production, replace this with:
  //   const response = await axios.post(apiEndpoint, payload, { headers: { Authorization: authToken } });
  //   return response.data;
  logger.info({ gspId, billNo: payload.DocDtls.No }, 'Submitting E-Invoice to GSP API');

  return {
    submitted: false,
    localIRN: generateLocalIRN(payload),
    payload,
    message: 'GSP integration hook ready. Implement actual API call when GSP registration is complete.',
  };
};

// ── Utility Helpers ──

/**
 * Format date to DD/MM/YYYY as required by NIC
 */
function formatDate(date) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Get Indian state code from state name
 */
function getStateCode(state) {
  const codes = {
    'andhra pradesh': 37, 'arunachal pradesh': 12, 'assam': 18, 'bihar': 10,
    'chhattisgarh': 22, 'goa': 30, 'gujarat': 24, 'haryana': 6, 'himachal pradesh': 2,
    'jharkhand': 20, 'karnataka': 29, 'kerala': 32, 'madhya pradesh': 23,
    'maharashtra': 27, 'manipur': 14, 'meghalaya': 17, 'mizoram': 15, 'nagaland': 13,
    'odisha': 21, 'punjab': 3, 'rajasthan': 8, 'sikkim': 11, 'tamil nadu': 33,
    'telangana': 36, 'tripura': 16, 'uttar pradesh': 9, 'uttarakhand': 5,
    'west bengal': 19, 'delhi': 7, 'jammu and kashmir': 1, 'ladakh': 38,
    'chandigarh': 4, 'dadra and nagar haveli': 26, 'daman and diu': 25,
    'lakshadweep': 31, 'puducherry': 34, 'andaman and nicobar': 35,
  };
  return codes[(state || '').toLowerCase()] || 27; // Default to Maharashtra
}

/**
 * Get financial year from DD/MM/YYYY date string
 */
function getFinancialYear(dateStr) {
  const parts = dateStr.split('/');
  const month = parseInt(parts[1]);
  const year = parseInt(parts[2]);
  return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}
