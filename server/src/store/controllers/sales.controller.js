import * as billingService from '../services/billing.service.js';

export const createSale = async (req, res, next) => {
  try {
    const sale = await billingService.createSaleBill(req.branchId, req.user.id, req.body);
    res.status(201).json({
      success: true,
      branchId: req.branchId,
      data: sale,
      message: `Invoice #${sale.billNumber} created successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const getSales = async (req, res, next) => {
  try {
    const result = await billingService.getSalesHistory(req.branchId, req.query);
    res.json({
      success: true,
      branchId: req.branchId,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getSaleDetails = async (req, res, next) => {
  try {
    const sale = await billingService.getSaleInvoiceData(req.branchId, req.params.id);
    res.json({
      success: true,
      branchId: req.branchId,
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelSale = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const cancelledSale = await billingService.cancelSaleBill(req.branchId, req.user.id, req.params.id, reason);
    res.json({
      success: true,
      branchId: req.branchId,
      data: cancelledSale,
      message: `Invoice #${cancelledSale.billNumber} cancelled and stock reverted`,
    });
  } catch (error) {
    next(error);
  }
};
