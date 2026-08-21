import { prisma } from '../config/db.js';
import { AppError } from '../errors/AppError.js';

/**
 * Creates a branch-isolated Prisma query wrapper for a given branchId.
 * This guarantees multi-tenant branch isolation at the database query layer.
 * 
 * @param {string} branchId - The tenant branch ID
 */
export const getScopedPrisma = (branchId) => {
  if (!branchId) {
    throw new AppError('Branch context is required for scoped database operations', 500, 'BRANCH_CONTEXT_MISSING');
  }

  return {
    // Direct access to raw client if needed
    raw: prisma,
    branchId,

    // Branch-scoped Batches & Inventory
    batch: {
      findMany: (args = {}) => {
        const where = { ...(args.where || {}), branchId };
        return prisma.batch.findMany({ ...args, where });
      },
      findFirst: (args = {}) => {
        const where = { ...(args.where || {}), branchId };
        return prisma.batch.findFirst({ ...args, where });
      },
      findUnique: async (args) => {
        // findUnique on composite or ID, verifying branchId
        if (args.where.id) {
          return prisma.batch.findFirst({
            where: { id: args.where.id, branchId },
            include: args.include,
            select: args.select,
          });
        }
        return prisma.batch.findFirst({
          where: { ...args.where, branchId },
          include: args.include,
          select: args.select,
        });
      },
      create: (args) => {
        const data = { ...args.data, branchId };
        return prisma.batch.create({ ...args, data });
      },
      update: async (args) => {
        // First verify ownership
        const existing = await prisma.batch.findFirst({
          where: { id: args.where.id, branchId },
        });
        if (!existing) {
          throw new AppError('Batch record not found in your branch', 404, 'NOT_FOUND');
        }
        return prisma.batch.update({ ...args, where: { id: existing.id } });
      },
      count: (args = {}) => {
        const where = { ...(args.where || {}), branchId };
        return prisma.batch.count({ ...args, where });
      },
    },

    // Branch-scoped Customers
    customer: {
      findMany: (args = {}) => {
        const where = { ...(args.where || {}), branchId };
        return prisma.customer.findMany({ ...args, where });
      },
      findFirst: (args = {}) => {
        const where = { ...(args.where || {}), branchId };
        return prisma.customer.findFirst({ ...args, where });
      },
      create: (args) => {
        const data = { ...args.data, branchId };
        return prisma.customer.create({ ...args, data });
      },
      count: (args = {}) => {
        const where = { ...(args.where || {}), branchId };
        return prisma.customer.count({ ...args, where });
      },
    },

    // Branch-scoped Suppliers
    supplier: {
      findMany: (args = {}) => {
        const where = {
          AND: [
            args.where || {},
            { OR: [{ branchId }, { branchId: null }] }, // Global or branch suppliers
          ],
        };
        return prisma.supplier.findMany({ ...args, where });
      },
      findFirst: (args = {}) => {
        const where = {
          AND: [
            args.where || {},
            { OR: [{ branchId }, { branchId: null }] },
          ],
        };
        return prisma.supplier.findFirst({ ...args, where });
      },
      create: (args) => {
        const data = { ...args.data, branchId };
        return prisma.supplier.create({ ...args, data });
      },
    },

    // Branch-scoped Sales
    sale: {
      findMany: (args = {}) => {
        const where = { ...(args.where || {}), branchId };
        return prisma.sale.findMany({ ...args, where });
      },
      findFirst: (args = {}) => {
        const where = { ...(args.where || {}), branchId };
        return prisma.sale.findFirst({ ...args, where });
      },
      create: (args) => {
        const data = { ...args.data, branchId };
        return prisma.sale.create({ ...args, data });
      },
      count: (args = {}) => {
        const where = { ...(args.where || {}), branchId };
        return prisma.sale.count({ ...args, where });
      },
      aggregate: (args = {}) => {
        const where = { ...(args.where || {}), branchId };
        return prisma.sale.aggregate({ ...args, where });
      },
    },

    // Branch-scoped Purchases
    purchase: {
      findMany: (args = {}) => {
        const where = { ...(args.where || {}), branchId };
        return prisma.purchase.findMany({ ...args, where });
      },
      findFirst: (args = {}) => {
        const where = { ...(args.where || {}), branchId };
        return prisma.purchase.findFirst({ ...args, where });
      },
      create: (args) => {
        const data = { ...args.data, branchId };
        return prisma.purchase.create({ ...args, data });
      },
      count: (args = {}) => {
        const where = { ...(args.where || {}), branchId };
        return prisma.purchase.count({ ...args, where });
      },
    },

    // Master Catalog (Read-Only across branches)
    medicine: {
      findMany: (args = {}) => prisma.medicine.findMany(args),
      findFirst: (args = {}) => prisma.medicine.findFirst(args),
      findUnique: (args) => prisma.medicine.findUnique(args),
    },
  };
};
