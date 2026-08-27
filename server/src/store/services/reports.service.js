import { prisma } from '../../shared/config/db.js';

/**
 * 1. Comprehensive Branch Analytics Overview
 */
export const getBranchReports = async (branchId, days = 14) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const trendStart = new Date(now.getTime() - parseInt(days) * 24 * 60 * 60 * 1000);

  // 1. Fetch Sales Aggregations
  const [
    todaySales,
    monthSales,
    totalSalesCount,
    salesTrendData,
    completedSalesItems,
    inventoryBatches,
  ] = await Promise.all([
    // Today's completed sales
    prisma.sale.aggregate({
      where: {
        branchId,
        status: 'COMPLETED',
        saleDate: { gte: todayStart },
      },
      _sum: { grandTotal: true, totalTaxAmount: true, discountAmount: true },
      _count: { id: true },
    }),

    // Month-to-date sales
    prisma.sale.aggregate({
      where: {
        branchId,
        status: 'COMPLETED',
        saleDate: { gte: monthStart },
      },
      _sum: { grandTotal: true, totalTaxAmount: true },
      _count: { id: true },
    }),

    // Total sales count
    prisma.sale.count({ where: { branchId } }),

    // Sales in the last N days for trend chart
    prisma.sale.findMany({
      where: {
        branchId,
        status: 'COMPLETED',
        saleDate: { gte: trendStart },
      },
      select: {
        saleDate: true,
        grandTotal: true,
        totalTaxAmount: true,
        paymentMode: true,
      },
      orderBy: { saleDate: 'asc' },
    }),

    // All completed sale items for fast-moving products and profit margin
    prisma.saleItem.findMany({
      where: {
        sale: {
          branchId,
          status: 'COMPLETED',
        },
      },
      include: {
        medicine: true,
        batch: true,
      },
      take: 500,
    }),

    // Batches for stock and expiry stats
    prisma.batch.findMany({
      where: { branchId, isArchived: false },
      include: { medicine: true },
    }),
  ]);

  // 2. Group daily sales trend for Recharts
  const trendMap = {};
  for (let i = parseInt(days) - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    trendMap[key] = { date: key, revenue: 0, tax: 0, bills: 0 };
  }

  salesTrendData.forEach((s) => {
    const key = new Date(s.saleDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    if (trendMap[key]) {
      trendMap[key].revenue += parseFloat(s.grandTotal);
      trendMap[key].tax += parseFloat(s.totalTaxAmount);
      trendMap[key].bills += 1;
    }
  });

  const dailyTrend = Object.values(trendMap);

  // 3. Payment mode breakup for PieChart
  const paymentMap = { CASH: 0, UPI: 0, CARD: 0, CREDIT: 0, SPLIT: 0 };
  salesTrendData.forEach((s) => {
    if (paymentMap[s.paymentMode] !== undefined) {
      paymentMap[s.paymentMode] += parseFloat(s.grandTotal);
    }
  });

  const paymentBreakup = Object.entries(paymentMap).map(([name, value]) => ({
    name,
    value: Math.round(value),
  }));

  // 4. Fast-moving & Profit calculation
  const medicineSalesMap = {};
  let totalGrossProfit = 0;
  let totalSalesValuation = 0;

  completedSalesItems.forEach((item) => {
    const medId = item.medicineId;
    const soldQty = item.quantity;
    const netRevenue = parseFloat(item.netAmount);
    const purchaseCost = item.batch ? parseFloat(item.batch.purchasePrice || 0) * soldQty : 0;
    const itemProfit = netRevenue - purchaseCost;

    totalSalesValuation += netRevenue;
    totalGrossProfit += itemProfit;

    if (!medicineSalesMap[medId]) {
      medicineSalesMap[medId] = {
        id: medId,
        name: item.medicine.name,
        composition: item.medicine.composition,
        category: item.medicine.category || 'General',
        totalQuantitySold: 0,
        totalRevenue: 0,
        totalProfit: 0,
      };
    }
    medicineSalesMap[medId].totalQuantitySold += soldQty;
    medicineSalesMap[medId].totalRevenue += netRevenue;
    medicineSalesMap[medId].totalProfit += itemProfit;
  });

  const fastMovingMedicines = Object.values(medicineSalesMap)
    .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
    .slice(0, 7)
    .map((m) => ({
      ...m,
      totalRevenue: Math.round(m.totalRevenue),
      totalProfit: Math.round(m.totalProfit),
    }));

  // 5. Stock & Expiry health
  let totalStockUnits = 0;
  let totalStockValuation = 0;
  let totalPurchaseValuation = 0;
  let nearExpiryCount = 0;
  let criticalExpiryCount = 0;
  let expiredCount = 0;
  let lowStockCount = 0;

  inventoryBatches.forEach((b) => {
    const qty = b.quantity;
    const mrp = parseFloat(b.mrp);
    const cost = parseFloat(b.purchasePrice || b.mrp * 0.75);

    totalStockUnits += qty;
    totalStockValuation += qty * mrp;
    totalPurchaseValuation += qty * cost;

    const exp = new Date(b.expiryDate);
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0 && qty > 0) expiredCount++;
    else if (diffDays <= 30 && qty > 0) criticalExpiryCount++;
    else if (diffDays <= 90 && qty > 0) nearExpiryCount++;

    if (qty <= (b.medicine?.minReorderLevel || 10)) lowStockCount++;
  });

  const overallProfitMargin =
    totalSalesValuation > 0 ? Math.round((totalGrossProfit / totalSalesValuation) * 100) : 0;

  return {
    today: {
      revenue: parseFloat(todaySales._sum.grandTotal || 0),
      taxCollected: parseFloat(todaySales._sum.totalTaxAmount || 0),
      discountsGiven: parseFloat(todaySales._sum.discountAmount || 0),
      billsCount: parseInt(todaySales._count.id || 0),
    },
    monthToDate: {
      revenue: parseFloat(monthSales._sum.grandTotal || 0),
      taxCollected: parseFloat(monthSales._sum.totalTaxAmount || 0),
      billsCount: parseInt(monthSales._count.id || 0),
    },
    stockHealth: {
      totalBatches: inventoryBatches.length,
      totalUnits: totalStockUnits,
      valuationMRP: Math.round(totalStockValuation),
      valuationCost: Math.round(totalPurchaseValuation),
      criticalExpiryCount,
      nearExpiryCount,
      expiredCount,
      lowStockCount,
    },
    profitMetrics: {
      totalGrossProfit: Math.round(totalGrossProfit),
      marginPercentage: overallProfitMargin,
    },
    dailyTrend,
    paymentBreakup,
    fastMovingMedicines,
  };
};

/**
 * 2. Slab-Wise GST Tax Summary (GSTR-1 Compliance)
 */
export const getGstSummaryReport = async (branchId, startDate, endDate) => {
  const where = {
    branchId,
    status: 'COMPLETED',
  };

  if (startDate || endDate) {
    where.saleDate = {};
    if (startDate) where.saleDate.gte = new Date(startDate);
    if (endDate) where.saleDate.lte = new Date(endDate);
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      items: {
        include: {
          medicine: true,
        },
      },
    },
  });

  // Group by GST rate slabs (0%, 5%, 12%, 18%, 28%)
  const slabMap = {
    0: { rate: 0, taxableValue: 0, cgst: 0, sgst: 0, totalTax: 0, totalValue: 0, itemCount: 0 },
    5: { rate: 5, taxableValue: 0, cgst: 0, sgst: 0, totalTax: 0, totalValue: 0, itemCount: 0 },
    12: { rate: 12, taxableValue: 0, cgst: 0, sgst: 0, totalTax: 0, totalValue: 0, itemCount: 0 },
    18: { rate: 18, taxableValue: 0, cgst: 0, sgst: 0, totalTax: 0, totalValue: 0, itemCount: 0 },
    28: { rate: 28, taxableValue: 0, cgst: 0, sgst: 0, totalTax: 0, totalValue: 0, itemCount: 0 },
  };

  let totalGrandSales = 0;
  let totalGrandTax = 0;
  let totalGrandTaxable = 0;

  sales.forEach((sale) => {
    totalGrandSales += parseFloat(sale.grandTotal);
    totalGrandTax += parseFloat(sale.totalTaxAmount);
    totalGrandTaxable += parseFloat(sale.subTotal);

    sale.items.forEach((item) => {
      const rate = Math.round(item.taxRate || item.medicine?.gstRate || 12);
      if (!slabMap[rate]) {
        slabMap[rate] = { rate, taxableValue: 0, cgst: 0, sgst: 0, totalTax: 0, totalValue: 0, itemCount: 0 };
      }
      const taxable = parseFloat(item.taxableAmount || item.netAmount);
      const tax = parseFloat(item.taxAmount || (taxable * rate) / 100);
      const halfTax = tax / 2;

      slabMap[rate].taxableValue += taxable;
      slabMap[rate].cgst += halfTax;
      slabMap[rate].sgst += halfTax;
      slabMap[rate].totalTax += tax;
      slabMap[rate].totalValue += taxable + tax;
      slabMap[rate].itemCount += item.quantity;
    });
  });

  const slabs = Object.values(slabMap).map((s) => ({
    rate: s.rate,
    rateLabel: `${s.rate}% GST (${(s.rate / 2).toFixed(1)}% CGST + ${(s.rate / 2).toFixed(1)}% SGST)`,
    taxableValue: parseFloat(s.taxableValue.toFixed(2)),
    cgst: parseFloat(s.cgst.toFixed(2)),
    sgst: parseFloat(s.sgst.toFixed(2)),
    totalTax: parseFloat(s.totalTax.toFixed(2)),
    totalValue: parseFloat(s.totalValue.toFixed(2)),
    itemCount: s.itemCount,
  }));

  return {
    totalInvoices: sales.length,
    totalTaxable: parseFloat(totalGrandTaxable.toFixed(2)),
    totalTax: parseFloat(totalGrandTax.toFixed(2)),
    grandTotal: parseFloat(totalGrandSales.toFixed(2)),
    slabs,
  };
};

/**
 * 3. Stock Movement & Slow/Dead Stock Analyzer
 */
export const getStockMovementReport = async (branchId) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [batches, recentSaleItems] = await Promise.all([
    prisma.batch.findMany({
      where: { branchId, isArchived: false, quantity: { gt: 0 } },
      include: { medicine: true },
    }),
    prisma.saleItem.findMany({
      where: {
        sale: {
          branchId,
          status: 'COMPLETED',
          saleDate: { gte: thirtyDaysAgo },
        },
      },
      select: { batchId: true, quantity: true },
    }),
  ]);

  const activeBatchSales = {};
  recentSaleItems.forEach((si) => {
    activeBatchSales[si.batchId] = (activeBatchSales[si.batchId] || 0) + si.quantity;
  });

  const fastMoving = [];
  const slowMoving = [];
  const deadStock = [];

  batches.forEach((b) => {
    const soldIn30Days = activeBatchSales[b.id] || 0;
    const valuation = Math.round(b.quantity * parseFloat(b.purchasePrice || b.mrp));

    const item = {
      id: b.id,
      medicineName: b.medicine.name,
      batchNumber: b.batchNumber,
      quantity: b.quantity,
      mrp: parseFloat(b.mrp),
      soldIn30Days,
      expiryDate: b.expiryDate,
      valuation,
    };

    if (soldIn30Days >= 10) {
      fastMoving.push(item);
    } else if (soldIn30Days > 0) {
      slowMoving.push(item);
    } else {
      deadStock.push(item);
    }
  });

  return {
    summary: {
      totalActiveBatches: batches.length,
      fastMovingCount: fastMoving.length,
      slowMovingCount: slowMoving.length,
      deadStockCount: deadStock.length,
      deadStockValuation: deadStock.reduce((acc, i) => acc + i.valuation, 0),
    },
    fastMoving: fastMoving.slice(0, 10),
    slowMoving: slowMoving.slice(0, 10),
    deadStock: deadStock.slice(0, 15),
  };
};
