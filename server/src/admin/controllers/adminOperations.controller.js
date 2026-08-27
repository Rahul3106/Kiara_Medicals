import { prisma } from '../../shared/config/db.js';
import { AppError } from '../../shared/errors/AppError.js';

/**
 * 1. Consolidated Inventory across all branches
 */
export const getConsolidatedInventory = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const where = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { genericName: { contains: search } },
        { composition: { contains: search } },
        { hsnCode: { contains: search } },
      ];
    }
    if (category) {
      where.category = category;
    }

    const [medicines, branches] = await Promise.all([
      prisma.medicine.findMany({
        where,
        include: {
          batches: {
            where: { isArchived: false },
            include: {
              branch: {
                select: { id: true, name: true, code: true },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.branch.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true },
      }),
    ]);

    // Format consolidated stock per branch for each medicine
    const formatted = medicines.map((med) => {
      const branchStockMap = {};
      branches.forEach((b) => {
        branchStockMap[b.code] = 0;
      });

      let totalEnterpriseStock = 0;
      med.batches.forEach((batch) => {
        if (batch.branch?.code) {
          branchStockMap[batch.branch.code] = (branchStockMap[batch.branch.code] || 0) + batch.quantity;
        }
        totalEnterpriseStock += batch.quantity;
      });

      return {
        id: med.id,
        name: med.name,
        genericName: med.genericName,
        composition: med.composition,
        manufacturer: med.manufacturer,
        category: med.category,
        hsnCode: med.hsnCode,
        unit: med.unit,
        gstRate: med.gstRate,
        minReorderLevel: med.minReorderLevel,
        prescriptionRequired: med.prescriptionRequired,
        totalStock: totalEnterpriseStock,
        branchStock: branchStockMap,
        batchCount: med.batches.length,
        isLowStock: totalEnterpriseStock <= med.minReorderLevel,
      };
    });

    res.json({
      success: true,
      data: {
        medicines: formatted,
        branches,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Master Medicine catalog item
 */
export const createMasterMedicine = async (req, res, next) => {
  try {
    const {
      name,
      genericName,
      composition,
      manufacturer,
      category,
      hsnCode = '3004',
      unit = 'STRIP',
      gstRate = 12.0,
      minReorderLevel = 10,
      prescriptionRequired = false,
    } = req.body;

    if (!name) {
      throw new AppError('Medicine Brand Name is required', 400, 'MISSING_NAME');
    }

    const medicine = await prisma.medicine.create({
      data: {
        name: name.trim(),
        genericName: genericName ? genericName.trim() : null,
        composition: composition ? composition.trim() : null,
        manufacturer: manufacturer ? manufacturer.trim() : null,
        category: category ? category.trim() : null,
        hsnCode: hsnCode.trim(),
        unit,
        gstRate: parseFloat(gstRate),
        minReorderLevel: parseInt(minReorderLevel),
        prescriptionRequired: Boolean(prescriptionRequired),
      },
    });

    res.status(201).json({
      success: true,
      data: medicine,
      message: 'Medicine added to Central Master Catalog',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Consolidated Sales across all branches
 */
export const getConsolidatedSales = async (req, res, next) => {
  try {
    const { branchId, status, search, page = 1, limit = 25 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { billNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
      ];
    }

    const [sales, total, totalRevenueAgg] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true, code: true } },
          customer: { select: { id: true, name: true, phone: true } },
          billedBy: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { saleDate: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.sale.count({ where }),
      prisma.sale.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { grandTotal: true, totalTaxAmount: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        sales,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRevenue: totalRevenueAgg._sum.grandTotal || 0,
        totalTax: totalRevenueAgg._sum.totalTaxAmount || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Global Expiry Monitor across all branches
 */
export const getGlobalExpiryOverview = async (req, res, next) => {
  try {
    const { branchId, days = 90 } = req.query;
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + parseInt(days));

    const where = {
      isArchived: false,
      quantity: { gt: 0 },
      expiryDate: { lte: futureDate },
    };
    if (branchId) where.branchId = branchId;

    const batches = await prisma.batch.findMany({
      where,
      include: {
        medicine: true,
        branch: { select: { id: true, name: true, code: true, city: true } },
      },
      orderBy: { expiryDate: 'asc' },
    });

    const enriched = batches.map((b) => {
      const exp = new Date(b.expiryDate);
      const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
      let status = 'VALID';
      if (diffDays <= 0) status = 'EXPIRED';
      else if (diffDays <= 30) status = 'CRITICAL';
      else if (diffDays <= 90) status = 'NEAR_EXPIRY';

      return {
        ...b,
        daysToExpiry: diffDays,
        status,
        atRiskValuation: Math.round(b.quantity * parseFloat(b.purchasePrice || b.mrp)),
      };
    });

    const totalAtRiskValuation = enriched.reduce((sum, b) => sum + b.atRiskValuation, 0);

    res.json({
      success: true,
      data: {
        batches: enriched,
        totalAtRiskValuation,
        count: enriched.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. System Audit Logs
 */
export const getSystemAuditLogs = async (req, res, next) => {
  try {
    const { branchId, action, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (branchId) where.branchId = branchId;
    if (action) where.action = { contains: action };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true, code: true } },
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};
