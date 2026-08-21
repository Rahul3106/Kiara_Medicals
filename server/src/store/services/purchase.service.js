import { prisma } from '../../shared/config/db.js';
import { AppError } from '../../shared/errors/AppError.js';

/**
 * Creates a new purchase entry and increments batch inventory atomically
 */
export const createPurchaseEntry = async (branchId, userId, payload) => {
  const {
    supplierId,
    invoiceNumber,
    purchaseDate,
    items,
    discountAmount = 0,
    paymentStatus = 'PENDING',
    notes,
    invoiceScanUrl,
  } = payload;

  if (!supplierId || !invoiceNumber || !purchaseDate || !items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Missing required purchase order fields or empty items list', 400, 'MISSING_FIELDS');
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Verify supplier exists and is accessible for this branch
    const supplier = await tx.supplier.findFirst({
      where: {
        id: supplierId,
        OR: [{ branchId }, { branchId: null }],
      },
    });

    if (!supplier) {
      throw new AppError('Selected supplier not found or inactive', 404, 'SUPPLIER_NOT_FOUND');
    }

    // 2. Check for duplicate invoice from this supplier in this branch
    const duplicate = await tx.purchase.findFirst({
      where: {
        branchId,
        supplierId,
        invoiceNumber: invoiceNumber.trim(),
      },
    });

    if (duplicate) {
      throw new AppError(
        `Invoice number "${invoiceNumber}" has already been entered for this supplier`,
        409,
        'DUPLICATE_INVOICE'
      );
    }

    // 3. Compute totals and process batch items
    let subTotal = 0;
    let totalTaxAmount = 0;

    const processedItems = [];

    for (const item of items) {
      const {
        medicineId,
        batchNumber,
        expiryDate,
        quantity,
        freeQuantity = 0,
        purchasePrice,
        mrp,
        taxRate = 12.0,
        rackLocation,
      } = item;

      if (!medicineId || !batchNumber || !expiryDate || !quantity || !purchasePrice || !mrp) {
        throw new AppError('Invalid purchase line item details', 400, 'INVALID_ITEM');
      }

      const qty = parseInt(quantity);
      const freeQty = parseInt(freeQuantity) || 0;
      const totalQty = qty + freeQty;
      const unitPurchasePrice = parseFloat(purchasePrice);
      const unitMrp = parseFloat(mrp);
      const rateTax = parseFloat(taxRate);

      const itemSubtotal = qty * unitPurchasePrice;
      const itemTax = (itemSubtotal * rateTax) / 100;
      const itemTotal = itemSubtotal + itemTax;

      subTotal += itemSubtotal;
      totalTaxAmount += itemTax;

      // 4. Find or Create Batch in this branch
      let batch = await tx.batch.findFirst({
        where: {
          branchId,
          medicineId,
          batchNumber: batchNumber.trim().toUpperCase(),
        },
      });

      const expDateParsed = new Date(expiryDate);

      if (batch) {
        // Increment stock and update purchase/selling prices
        batch = await tx.batch.update({
          where: { id: batch.id },
          data: {
            quantity: batch.quantity + totalQty,
            purchasePrice: unitPurchasePrice,
            mrp: unitMrp,
            sellingPrice: unitMrp,
            expiryDate: expDateParsed,
            ...(rackLocation && { rackLocation }),
          },
        });
      } else {
        // Create new batch record
        batch = await tx.batch.create({
          data: {
            branchId,
            medicineId,
            batchNumber: batchNumber.trim().toUpperCase(),
            expiryDate: expDateParsed,
            purchasePrice: unitPurchasePrice,
            mrp: unitMrp,
            sellingPrice: unitMrp,
            quantity: totalQty,
            rackLocation: rackLocation || null,
          },
        });
      }

      processedItems.push({
        medicineId,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        expiryDate: expDateParsed,
        quantity: qty,
        freeQuantity: freeQty,
        purchasePrice: unitPurchasePrice,
        mrp: unitMrp,
        taxRate: rateTax,
        taxAmount: Math.round(itemTax * 100) / 100,
        totalAmount: Math.round(itemTotal * 100) / 100,
      });
    }

    const netAmount = Math.max(0, subTotal + totalTaxAmount - parseFloat(discountAmount));

    // 5. Create Purchase record
    const purchase = await tx.purchase.create({
      data: {
        branchId,
        supplierId,
        createdById: userId,
        invoiceNumber: invoiceNumber.trim(),
        purchaseDate: new Date(purchaseDate),
        subTotal: Math.round(subTotal * 100) / 100,
        taxAmount: Math.round(totalTaxAmount * 100) / 100,
        discountAmount: parseFloat(discountAmount),
        netAmount: Math.round(netAmount * 100) / 100,
        paymentStatus,
        notes,
        invoiceScanUrl,
        items: {
          create: processedItems,
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            medicine: true,
            batch: true,
          },
        },
      },
    });

    // 6. Record Audit Log for Inventory Inward
    await tx.auditLog.create({
      data: {
        branchId,
        userId,
        action: 'PURCHASE_STOCK_INWARD',
        entityType: 'Purchase',
        entityId: purchase.id,
        newValues: {
          invoiceNumber: purchase.invoiceNumber,
          netAmount: purchase.netAmount,
          itemCount: processedItems.length,
        },
      },
    });

    return purchase;
  });
};

/**
 * List Branch Purchase History
 */
export const getPurchaseHistory = async (branchId, options = {}) => {
  const { search, page = 1, limit = 20 } = options;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { branchId };

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search } },
      { supplier: { name: { contains: search } } },
    ];
  }

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: {
        supplier: true,
        createdBy: {
          select: { id: true, name: true },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { purchaseDate: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.purchase.count({ where }),
  ]);

  return {
    purchases,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
  };
};

/**
 * Get Specific Purchase Order Details
 */
export const getPurchaseDetails = async (branchId, purchaseId) => {
  const purchase = await prisma.purchase.findFirst({
    where: { id: purchaseId, branchId },
    include: {
      supplier: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      items: {
        include: {
          medicine: true,
          batch: true,
        },
      },
    },
  });

  if (!purchase) {
    throw new AppError('Purchase record not found in your branch', 404, 'NOT_FOUND');
  }

  return purchase;
};
