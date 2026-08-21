import { prisma } from '../../shared/config/db.js';
import { AppError } from '../../shared/errors/AppError.js';

export const listSuppliers = async (branchId, search = '') => {
  const where = {
    AND: [
      { isActive: true },
      { OR: [{ branchId }, { branchId: null }] },
    ],
  };

  if (search) {
    where.AND.push({
      OR: [
        { name: { contains: search } },
        { agencyName: { contains: search } },
        { phone: { contains: search } },
        { gstNumber: { contains: search } },
      ],
    });
  }

  return await prisma.supplier.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { purchases: { where: { branchId } } },
      },
    },
  });
};

export const createSupplier = async (branchId, data) => {
  const { name, agencyName, contactPerson, phone, email, address, gstNumber, drugLicenseNo } = data;

  if (!name || !phone) {
    throw new AppError('Supplier Name and Phone are required', 400, 'MISSING_FIELDS');
  }

  return await prisma.supplier.create({
    data: {
      branchId,
      name,
      agencyName,
      contactPerson,
      phone,
      email,
      address,
      gstNumber: gstNumber ? gstNumber.toUpperCase().trim() : null,
      drugLicenseNo,
    },
  });
};
