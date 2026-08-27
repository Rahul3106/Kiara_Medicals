import { prisma } from '../../shared/config/db.js';
import { AppError } from '../../shared/errors/AppError.js';
import { numberToWords } from '../../shared/utils/numberToWords.util.js';

/**
 * Generates the next formatted sequential Tax Invoice number for a branch.
 * Format: KM-[BRANCH_CODE]-[FINANCIAL_YEAR]-[SEQUENCE_NUMBER]
 * Example: KM-BR-A-2627-00001
 */
export const generateNextBillNumber = async (branchId, tx = prisma) => {
  const branch = await tx.branch.findUnique({
    where: { id: branchId },
    select: { code: true },
  });

  if (!branch) {
    throw new AppError('Branch not found', 404, 'BRANCH_NOT_FOUND');
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  // In India, Financial Year starts from April (Month 4) to March (Month 3)
  let fyStartYear = currentYear;
  let fyEndYear = currentYear + 1;
  if (currentMonth < 4) {
    fyStartYear = currentYear - 1;
    fyEndYear = currentYear;
  }

  const fyCode = `${String(fyStartYear).slice(-2)}${String(fyEndYear).slice(-2)}`;
  const branchCodeClean = branch.code.trim();
  const prefix = `KM-${branchCodeClean}-${fyCode}-`;

  // Find the highest sequence number for this branch in current FY
  const lastSale = await tx.sale.findFirst({
    where: {
      branchId,
      billNumber: { startsWith: prefix },
    },
    orderBy: { createdAt: 'desc' },
    select: { billNumber: true },
  });

  let nextSequence = 1;
  if (lastSale && lastSale.billNumber) {
    const parts = lastSale.billNumber.split('-');
    const lastSeqStr = parts[parts.length - 1];
    const parsedSeq = parseInt(lastSeqStr, 10);
    if (!isNaN(parsedSeq)) {
      nextSequence = parsedSeq + 1;
    }
  }

  const sequenceFormatted = String(nextSequence).padStart(5, '0');
  return `${prefix}${sequenceFormatted}`;
};

/**
 * Creates a new POS Sales Bill with atomic stock deduction and GST calculation
 */
export const createSaleBill = async (branchId, userId, payload) => {
  const {
    customer,
    customerId: inputCustomerId,
    items,
    paymentMode = 'CASH',
    notes,
    prescriptionUrl,
    customDiscount = 0,
  } = payload;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('At least one medicine line item is required to generate a bill', 400, 'NO_ITEMS');
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Handle Customer creation / lookup
    let customerId = inputCustomerId || null;

    if (!customerId && customer && customer.phone && customer.phone.trim()) {
      const cleanPhone = customer.phone.trim();
      let existingCustomer = await tx.customer.findFirst({
        where: {
          branchId,
          phone: cleanPhone,
        },
      });

      if (existingCustomer) {
        // Update customer details if provided
        existingCustomer = await tx.customer.update({
          where: { id: existingCustomer.id },
          data: {
            name: customer.name ? customer.name.trim() : existingCustomer.name,
            doctorName: customer.doctorName !== undefined ? customer.doctorName : existingCustomer.doctorName,
            doctorRegNo: customer.doctorRegNo !== undefined ? customer.doctorRegNo : existingCustomer.doctorRegNo,
            address: customer.address !== undefined ? customer.address : existingCustomer.address,
          },
        });
        customerId = existingCustomer.id;
      } else if (customer.name && customer.name.trim()) {
        const newCustomer = await tx.customer.create({
          data: {
            branchId,
            name: customer.name.trim(),
            phone: cleanPhone,
            email: customer.email ? customer.email.trim() : null,
            address: customer.address ? customer.address.trim() : null,
            doctorName: customer.doctorName ? customer.doctorName.trim() : null,
            doctorRegNo: customer.doctorRegNo ? customer.doctorRegNo.trim() : null,
          },
        });
        customerId = newCustomer.id;
      }
    }

    // 2. Process Line Items and verify Batches
    let calculatedSubTotal = 0;
    let calculatedCgst = 0;
    let calculatedSgst = 0;
    let calculatedIgst = 0;
    let calculatedDiscountTotal = parseFloat(customDiscount) || 0;

    const processedSaleItems = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const item of items) {
      const {
        medicineId,
        batchId,
        quantity,
        unitPrice: inputUnitPrice,
        discountPercent = 0,
      } = item;

      const qty = parseInt(quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        throw new AppError('Line item quantity must be greater than 0', 400, 'INVALID_QUANTITY');
      }

      // Fetch Batch from DB with strict branch isolation
      const batch = await tx.batch.findFirst({
        where: {
          id: batchId,
          branchId,
          medicineId,
        },
        include: {
          medicine: true,
        },
      });

      if (!batch) {
        throw new AppError(`Batch not found or does not belong to this branch`, 404, 'BATCH_NOT_FOUND');
      }

      // Safety check: Expiry verification
      const batchExp = new Date(batch.expiryDate);
      if (batchExp < today) {
        throw new AppError(
          `Cannot sell expired medicine "${batch.medicine.name}" (Batch ${batch.batchNumber}, Expired: ${batchExp.toLocaleDateString()})`,
          400,
          'MEDICINE_EXPIRED'
        );
      }

      // Safety check: Inventory stock availability
      if (batch.quantity < qty) {
        throw new AppError(
          `Insufficient stock for "${batch.medicine.name}" (Batch ${batch.batchNumber}). Available: ${batch.quantity}, Requested: ${qty}`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }

      // 3. Atomically Deduct Batch Stock
      await tx.batch.update({
        where: { id: batch.id },
        data: {
          quantity: batch.quantity - qty,
        },
      });

      // 4. Calculations (GST & Discounts)
      const sellingPrice = inputUnitPrice !== undefined ? parseFloat(inputUnitPrice) : parseFloat(batch.sellingPrice || batch.mrp);
      const mrp = parseFloat(batch.mrp);
      const discPct = Math.max(0, Math.min(100, parseFloat(discountPercent) || 0));
      const lineTaxRate = parseFloat(batch.medicine.taxRate || 12.0);

      const grossAmount = qty * sellingPrice;
      const lineDiscount = (grossAmount * discPct) / 100;
      const taxableValue = grossAmount - lineDiscount;

      // Intra-state GST (CGST + SGST split 50-50)
      const halfRate = lineTaxRate / 2;
      const lineCgst = (taxableValue * halfRate) / 100;
      const lineSgst = (taxableValue * halfRate) / 100;
      const lineNet = taxableValue + lineCgst + lineSgst;

      calculatedSubTotal += taxableValue;
      calculatedCgst += lineCgst;
      calculatedSgst += lineSgst;
      calculatedDiscountTotal += lineDiscount;

      processedSaleItems.push({
        medicineId: batch.medicineId,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantity: qty,
        unitPrice: sellingPrice,
        mrp: mrp,
        discountPercent: discPct,
        discountAmount: Math.round(lineDiscount * 100) / 100,
        taxRate: lineTaxRate,
        cgstAmount: Math.round(lineCgst * 100) / 100,
        sgstAmount: Math.round(lineSgst * 100) / 100,
        igstAmount: 0.0,
        netAmount: Math.round(lineNet * 100) / 100,
      });
    }

    const totalTaxAmount = calculatedCgst + calculatedSgst + calculatedIgst;
    const exactGrandTotal = calculatedSubTotal + totalTaxAmount;
    const roundedGrandTotal = Math.round(exactGrandTotal);
    const roundOff = roundedGrandTotal - exactGrandTotal;

    // 5. Generate Next Sequential Invoice Number
    const billNumber = await generateNextBillNumber(branchId, tx);

    // 6. Create Sale Record
    const sale = await tx.sale.create({
      data: {
        branchId,
        customerId,
        billedById: userId,
        billNumber,
        subTotal: Math.round(calculatedSubTotal * 100) / 100,
        cgstAmount: Math.round(calculatedCgst * 100) / 100,
        sgstAmount: Math.round(calculatedSgst * 100) / 100,
        igstAmount: Math.round(calculatedIgst * 100) / 100,
        totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
        discountAmount: Math.round(calculatedDiscountTotal * 100) / 100,
        roundOff: Math.round(roundOff * 100) / 100,
        grandTotal: roundedGrandTotal,
        paymentMode,
        status: 'COMPLETED',
        prescriptionUrl,
        notes,
        items: {
          create: processedSaleItems,
        },
      },
      include: {
        branch: true,
        customer: true,
        billedBy: {
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

    // 7. Audit Log
    await tx.auditLog.create({
      data: {
        branchId,
        userId,
        action: 'SALE_BILL_CREATED',
        entityType: 'Sale',
        entityId: sale.id,
        newValues: JSON.stringify({
          billNumber: sale.billNumber,
          grandTotal: sale.grandTotal,
          itemCount: processedSaleItems.length,
          paymentMode: sale.paymentMode,
        }),
      },
    });

    return sale;
  });
};

/**
 * List Branch Sales History with Search & Pagination
 */
export const getSalesHistory = async (branchId, options = {}) => {
  const { search, status, startDate, endDate, page = 1, limit = 20 } = options;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { branchId };

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.saleDate = {};
    if (startDate) where.saleDate.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.saleDate.lte = end;
    }
  }

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
        customer: {
          select: { id: true, name: true, phone: true, doctorName: true },
        },
        billedBy: {
          select: { id: true, name: true },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { saleDate: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.sale.count({ where }),
    prisma.sale.aggregate({
      where: { ...where, status: 'COMPLETED' },
      _sum: { grandTotal: true },
    }),
  ]);

  return {
    sales,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    totalRevenue: totalRevenueAgg._sum.grandTotal || 0,
  };
};

/**
 * Get Specific Sale Bill with complete GST Invoice breakdown and amount in words
 */
export const getSaleInvoiceData = async (branchId, saleId) => {
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, branchId },
    include: {
      branch: true,
      customer: true,
      billedBy: {
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

  if (!sale) {
    throw new AppError('Sale bill not found in your branch', 404, 'NOT_FOUND');
  }

  // Generate Amount in Words
  const amountInWords = numberToWords(parseFloat(sale.grandTotal));

  // Compute GST Tax Summary Slab-wise (e.g. 5%, 12%, 18%)
  const taxSummaryMap = {};
  sale.items.forEach((item) => {
    const rate = parseFloat(item.taxRate);
    if (!taxSummaryMap[rate]) {
      taxSummaryMap[rate] = {
        taxRate: rate,
        taxableAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTax: 0,
      };
    }
    const itemNet = parseFloat(item.netAmount);
    const itemCgst = parseFloat(item.cgstAmount);
    const itemSgst = parseFloat(item.sgstAmount);
    const itemIgst = parseFloat(item.igstAmount);
    const itemTax = itemCgst + itemSgst + itemIgst;
    const taxable = itemNet - itemTax;

    taxSummaryMap[rate].taxableAmount += taxable;
    taxSummaryMap[rate].cgstAmount += itemCgst;
    taxSummaryMap[rate].sgstAmount += itemSgst;
    taxSummaryMap[rate].igstAmount += itemIgst;
    taxSummaryMap[rate].totalTax += itemTax;
  });

  const taxSummary = Object.values(taxSummaryMap).map((summary) => ({
    ...summary,
    taxableAmount: Math.round(summary.taxableAmount * 100) / 100,
    cgstAmount: Math.round(summary.cgstAmount * 100) / 100,
    sgstAmount: Math.round(summary.sgstAmount * 100) / 100,
    totalTax: Math.round(summary.totalTax * 100) / 100,
  }));

  return {
    ...sale,
    amountInWords,
    taxSummary,
  };
};

/**
 * Cancel Sale Bill & Atomically Revert Batch Stock
 */
export const cancelSaleBill = async (branchId, userId, saleId, reason) => {
  return await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findFirst({
      where: { id: saleId, branchId },
      include: { items: true },
    });

    if (!sale) {
      throw new AppError('Sale bill not found', 404, 'NOT_FOUND');
    }

    if (sale.status === 'CANCELLED') {
      throw new AppError('This bill is already cancelled', 400, 'ALREADY_CANCELLED');
    }

    // 1. Revert Inventory Stock for all items in this bill
    for (const item of sale.items) {
      const batch = await tx.batch.findUnique({
        where: { id: item.batchId },
      });

      if (batch) {
        await tx.batch.update({
          where: { id: batch.id },
          data: {
            quantity: batch.quantity + item.quantity,
          },
        });
      }
    }

    // 2. Update Sale Status
    const updatedSale = await tx.sale.update({
      where: { id: sale.id },
      data: {
        status: 'CANCELLED',
        notes: sale.notes
          ? `${sale.notes} | Cancelled: ${reason || 'Customer Return/Void'}`
          : `Cancelled: ${reason || 'Customer Return/Void'}`,
      },
      include: {
        customer: true,
        items: true,
      },
    });

    // 3. Record Audit Log
    await tx.auditLog.create({
      data: {
        branchId,
        userId,
        action: 'SALE_BILL_CANCELLED',
        entityType: 'Sale',
        entityId: sale.id,
        oldValues: JSON.stringify({ status: 'COMPLETED' }),
        newValues: JSON.stringify({ status: 'CANCELLED', reason }),
      },
    });

    return updatedSale;
  });
};
