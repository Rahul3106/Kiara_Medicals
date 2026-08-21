import { prisma } from '../../shared/config/db.js';
import { AppError } from '../../shared/errors/AppError.js';

/**
 * Get Branch Inventory with advanced filtering and pagination
 */
export const getBranchInventory = async (branchId, options = {}) => {
  const { search, category, filter, page = 1, limit = 50 } = options;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    branchId,
    isArchived: false,
  };

  if (search) {
    where.OR = [
      { batchNumber: { contains: search } },
      { medicine: { name: { contains: search } } },
      { medicine: { genericName: { contains: search } } },
      { rackLocation: { contains: search } },
    ];
  }

  if (category) {
    where.medicine = { ...where.medicine, category };
  }

  const now = new Date();
  if (filter === 'near-expiry') {
    const ninetyDays = new Date();
    ninetyDays.setDate(now.getDate() + 90);
    where.expiryDate = { lte: ninetyDays };
    where.quantity = { gt: 0 };
  } else if (filter === 'expired') {
    where.expiryDate = { lte: now };
  }

  const [items, total] = await Promise.all([
    prisma.batch.findMany({
      where,
      include: {
        medicine: true,
      },
      orderBy: [
        { expiryDate: 'asc' },
        { quantity: 'asc' },
      ],
      skip,
      take: parseInt(limit),
    }),
    prisma.batch.count({ where }),
  ]);

  // Compute expiry status for each batch
  const enrichedItems = items.map((batch) => {
    const expDate = new Date(batch.expiryDate);
    const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
    let expiryStatus = 'VALID'; // VALID, NEAR_EXPIRY, CRITICAL, EXPIRED

    if (diffDays <= 0) {
      expiryStatus = 'EXPIRED';
    } else if (diffDays <= 30) {
      expiryStatus = 'CRITICAL';
    } else if (diffDays <= 90) {
      expiryStatus = 'NEAR_EXPIRY';
    }

    return {
      ...batch,
      daysToExpiry: diffDays,
      expiryStatus,
    };
  });

  return {
    items: enrichedItems,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
  };
};

/**
 * Adjust stock quantity with mandatory audit logging
 */
export const adjustStock = async (branchId, userId, data) => {
  const { batchId, adjustmentType, quantityChange, reason } = data;

  if (!batchId || !adjustmentType || quantityChange === undefined) {
    throw new AppError('Missing required adjustment parameters', 400, 'MISSING_FIELDS');
  }

  const change = parseInt(quantityChange);
  if (isNaN(change) || change === 0) {
    throw new AppError('Quantity change must be a non-zero integer', 400, 'INVALID_QUANTITY');
  }

  return await prisma.$transaction(async (tx) => {
    const batch = await tx.batch.findFirst({
      where: { id: batchId, branchId },
      include: { medicine: true },
    });

    if (!batch) {
      throw new AppError('Batch record not found in your branch', 404, 'NOT_FOUND');
    }

    const previousQuantity = batch.quantity;
    let newQuantity;

    if (adjustmentType === 'CORRECTION_SET') {
      newQuantity = change;
    } else if (adjustmentType === 'DAMAGE_OR_LOSS' || adjustmentType === 'EXPIRY_DISPOSAL') {
      newQuantity = previousQuantity - Math.abs(change);
    } else if (adjustmentType === 'AUDIT_ADD') {
      newQuantity = previousQuantity + Math.abs(change);
    } else {
      newQuantity = previousQuantity + change;
    }

    if (newQuantity < 0) {
      throw new AppError(
        `Cannot adjust stock below 0. Current stock is ${previousQuantity}`,
        400,
        'INSUFFICIENT_STOCK'
      );
    }

    const updatedBatch = await tx.batch.update({
      where: { id: batch.id },
      data: { quantity: newQuantity },
      include: { medicine: true },
    });

    // Record Audit Log
    await tx.auditLog.create({
      data: {
        branchId,
        userId,
        action: `STOCK_ADJUSTMENT_${adjustmentType}`,
        entityType: 'Batch',
        entityId: batch.id,
        oldValues: { quantity: previousQuantity, batchNumber: batch.batchNumber, medicine: batch.medicine.name },
        newValues: { quantity: newQuantity, reason: reason || 'Manual adjustment' },
      },
    });

    return {
      batch: updatedBatch,
      previousQuantity,
      newQuantity,
      adjustmentType,
      reason,
    };
  });
};
