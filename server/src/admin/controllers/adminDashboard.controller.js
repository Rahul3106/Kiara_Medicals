import { prisma } from '../../shared/config/db.js';

/**
 * Super Admin Consolidated Dashboard Overview
 * Can filter by branchId or aggregate all branches
 */
export const getAdminSummary = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const branchFilter = branchId ? { branchId } : {};

    const [
      totalBranches,
      totalUsers,
      totalMedicines,
      batches,
      salesAgg,
      totalSalesCount,
    ] = await Promise.all([
      prisma.branch.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.medicine.count({ where: { isActive: true } }),
      prisma.batch.findMany({
        where: { ...branchFilter, isArchived: false },
        select: {
          quantity: true,
          purchasePrice: true,
          sellingPrice: true,
          expiryDate: true,
        },
      }),
      prisma.sale.aggregate({
        where: branchFilter,
        _sum: {
          grandTotal: true,
          totalTaxAmount: true,
          discountAmount: true,
        },
      }),
      prisma.sale.count({ where: branchFilter }),
    ]);

    // Inventory Valuation
    let totalStockUnits = 0;
    let inventoryCostValue = 0;
    let inventoryRetailValue = 0;
    const now = new Date();
    const ninetyDays = new Date();
    ninetyDays.setDate(now.getDate() + 90);
    let nearExpiryBatchesCount = 0;

    batches.forEach((b) => {
      totalStockUnits += b.quantity;
      inventoryCostValue += b.quantity * Number(b.purchasePrice);
      inventoryRetailValue += b.quantity * Number(b.sellingPrice);
      if (new Date(b.expiryDate) <= ninetyDays && b.quantity > 0) {
        nearExpiryBatchesCount += 1;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalBranches,
        totalUsers,
        totalMedicines,
        totalStockUnits,
        inventoryCostValue: Math.round(inventoryCostValue * 100) / 100,
        inventoryRetailValue: Math.round(inventoryRetailValue * 100) / 100,
        nearExpiryBatchesCount,
        totalRevenue: Number(salesAgg._sum.grandTotal || 0),
        totalTaxCollected: Number(salesAgg._sum.totalTaxAmount || 0),
        totalDiscounts: Number(salesAgg._sum.discountAmount || 0),
        totalSalesCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Branch Comparison (Shop A vs Shop B vs Shop C)
 */
export const getBranchComparison = async (req, res, next) => {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            users: true,
            batches: true,
            sales: true,
            purchases: true,
          },
        },
      },
    });

    const comparisonData = await Promise.all(
      branches.map(async (branch) => {
        const [salesAgg, batches] = await Promise.all([
          prisma.sale.aggregate({
            where: { branchId: branch.id },
            _sum: { grandTotal: true },
          }),
          prisma.batch.findMany({
            where: { branchId: branch.id, isArchived: false },
            select: { quantity: true, purchasePrice: true },
          }),
        ]);

        const inventoryValue = batches.reduce(
          (sum, b) => sum + b.quantity * Number(b.purchasePrice),
          0
        );

        return {
          id: branch.id,
          name: branch.name,
          code: branch.code,
          city: branch.city,
          userCount: branch._count.users,
          totalBills: branch._count.sales,
          totalRevenue: Number(salesAgg._sum.grandTotal || 0),
          inventoryValuation: Math.round(inventoryValue * 100) / 100,
          batchCount: branch._count.batches,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: comparisonData,
    });
  } catch (error) {
    next(error);
  }
};
