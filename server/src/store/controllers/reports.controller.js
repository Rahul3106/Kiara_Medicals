import * as reportsService from '../services/reports.service.js';

export const getReportsOverview = async (req, res, next) => {
  try {
    const { days = 14 } = req.query;
    const data = await reportsService.getBranchReports(req.branchId, days);
    res.json({
      success: true,
      branchId: req.branchId,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getGstSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportsService.getGstSummaryReport(req.branchId, startDate, endDate);
    res.json({
      success: true,
      branchId: req.branchId,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getStockMovement = async (req, res, next) => {
  try {
    const data = await reportsService.getStockMovementReport(req.branchId);
    res.json({
      success: true,
      branchId: req.branchId,
      data,
    });
  } catch (error) {
    next(error);
  }
};
