import {
  createPurchaseEntry,
  getPurchaseHistory,
  getPurchaseDetails,
} from '../services/purchase.service.js';
import { parseInvoiceScan } from '../services/ocrPlaceholder.service.js';

export const createPurchase = async (req, res, next) => {
  try {
    const purchase = await createPurchaseEntry(req.branchId, req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Purchase order recorded and batch inventory updated successfully',
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};

export const listPurchases = async (req, res, next) => {
  try {
    const data = await getPurchaseHistory(req.branchId, req.query);
    res.status(200).json({
      success: true,
      branchId: req.branchId,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await getPurchaseDetails(req.branchId, req.params.id);
    res.status(200).json({
      success: true,
      branchId: req.branchId,
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};

export const simulateOcrScan = async (req, res, next) => {
  try {
    const ocrResult = await parseInvoiceScan(req.body?.fileUrl || null);
    res.status(200).json(ocrResult);
  } catch (error) {
    next(error);
  }
};
