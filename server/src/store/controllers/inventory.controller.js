import {
  getBranchInventory,
  adjustStock as adjustStockService,
} from '../services/inventory.service.js';
import { prisma } from '../../shared/config/db.js';

/**
 * Get Branch Batches / Inventory with search & pagination
 */
export const getInventory = async (req, res, next) => {
  try {
    const data = await getBranchInventory(req.branchId, req.query);
    res.status(200).json({
      success: true,
      branchId: req.branchId,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Master Medicine Catalog for Purchase Entry / Dropdowns
 */
export const getMasterMedicines = async (req, res, next) => {
  try {
    const medicines = await prisma.medicine.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.status(200).json({
      success: true,
      data: medicines,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Stock Adjustment with Audit Trail
 */
export const adjustStock = async (req, res, next) => {
  try {
    const result = await adjustStockService(req.branchId, req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Stock adjustment applied successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Quick Medicine Search for POS with FEFO Batches
 */
export const searchMedicinesForPOS = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const medicines = await prisma.medicine.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q } },
          { genericName: { contains: q } },
        ],
      },
      include: {
        batches: {
          where: {
            branchId: req.branchId,
            quantity: { gt: 0 },
            isArchived: false,
          },
          orderBy: { expiryDate: 'asc' }, // FEFO: Earliest expiry first
        },
      },
      take: 20,
    });

    res.status(200).json({
      success: true,
      branchId: req.branchId,
      data: medicines,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Near-Expiry Batches (<= 90 days)
 */
export const getNearExpiry = async (req, res, next) => {
  try {
    const ninetyDaysLater = new Date();
    ninetyDaysLater.setDate(ninetyDaysLater.getDate() + 90);

    const batches = await prisma.batch.findMany({
      where: {
        branchId: req.branchId,
        expiryDate: { lte: ninetyDaysLater },
        quantity: { gt: 0 },
        isArchived: false,
      },
      include: { medicine: true },
      orderBy: { expiryDate: 'asc' },
    });

    res.status(200).json({
      success: true,
      branchId: req.branchId,
      data: batches,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Low-Stock Alerts
 */
export const getLowStock = async (req, res, next) => {
  try {
    const medicines = await prisma.medicine.findMany({
      where: { isActive: true },
      include: {
        batches: {
          where: { branchId: req.branchId, isArchived: false },
        },
      },
    });

    const lowStockItems = medicines
      .map((med) => {
        const totalStock = med.batches.reduce((sum, b) => sum + b.quantity, 0);
        return {
          medicine: med,
          totalStock,
          minReorderLevel: med.minReorderLevel,
          isLow: totalStock <= med.minReorderLevel,
        };
      })
      .filter((item) => item.isLow);

    res.status(200).json({
      success: true,
      branchId: req.branchId,
      data: lowStockItems,
    });
  } catch (error) {
    next(error);
  }
};
