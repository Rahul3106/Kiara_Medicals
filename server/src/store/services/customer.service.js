import { prisma } from '../../shared/config/db.js';
import { AppError } from '../../shared/errors/AppError.js';

/**
 * List or search customers for a branch
 */
export const listCustomers = async (branchId, search = '', page = 1, limit = 20) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = { branchId };

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { doctorName: { contains: search } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { sales: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
  };
};

/**
 * Quick search for POS billing autocomplete by phone number or name
 */
export const searchCustomersForPos = async (branchId, query = '') => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  return await prisma.customer.findMany({
    where: {
      branchId,
      OR: [
        { phone: { contains: query.trim() } },
        { name: { contains: query.trim() } },
      ],
    },
    take: 10,
    orderBy: { updatedAt: 'desc' },
  });
};

/**
 * Create or Update customer
 */
export const saveCustomer = async (branchId, data) => {
  const { name, phone, email, address, doctorName, doctorRegNo } = data;

  if (!name || !phone) {
    throw new AppError('Customer Name and Phone are required', 400, 'MISSING_FIELDS');
  }

  const cleanPhone = phone.trim();

  // Find if customer with this phone already exists in this branch
  const existing = await prisma.customer.findFirst({
    where: {
      branchId,
      phone: cleanPhone,
    },
  });

  if (existing) {
    return await prisma.customer.update({
      where: { id: existing.id },
      data: {
        name: name.trim(),
        email: email ? email.trim() : existing.email,
        address: address !== undefined ? address : existing.address,
        doctorName: doctorName !== undefined ? doctorName : existing.doctorName,
        doctorRegNo: doctorRegNo !== undefined ? doctorRegNo : existing.doctorRegNo,
      },
    });
  }

  return await prisma.customer.create({
    data: {
      branchId,
      name: name.trim(),
      phone: cleanPhone,
      email: email ? email.trim() : null,
      address: address ? address.trim() : null,
      doctorName: doctorName ? doctorName.trim() : null,
      doctorRegNo: doctorRegNo ? doctorRegNo.trim() : null,
    },
  });
};

/**
 * Get customer profile & past billing history
 */
export const getCustomerDetails = async (branchId, customerId) => {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, branchId },
    include: {
      sales: {
        orderBy: { saleDate: 'desc' },
        take: 15,
        include: {
          items: {
            include: {
              medicine: true,
            },
          },
        },
      },
    },
  });

  if (!customer) {
    throw new AppError('Customer not found in this branch', 404, 'CUSTOMER_NOT_FOUND');
  }

  return customer;
};
