import { prisma } from '../../shared/config/db.js';
import { AppError } from '../../shared/errors/AppError.js';

export const listBranches = async (req, res, next) => {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true, batches: true, sales: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: branches,
    });
  } catch (error) {
    next(error);
  }
};

export const createBranch = async (req, res, next) => {
  try {
    const { name, code, address, city, state, pincode, phone, email, gstNumber, drugLicenseNo } =
      req.body;

    if (!name || !code || !gstNumber || !drugLicenseNo || !phone || !city || !pincode) {
      return next(
        new AppError(
          'Missing required branch fields: name, code, address, city, pincode, phone, gstNumber, drugLicenseNo',
          400,
          'MISSING_FIELDS'
        )
      );
    }

    const existing = await prisma.branch.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (existing) {
      return next(new AppError(`Branch code ${code} is already registered`, 409, 'CODE_EXISTS'));
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        code: code.toUpperCase().trim(),
        address: address || '',
        city,
        state: state || 'Maharashtra',
        pincode,
        phone,
        email,
        gstNumber: gstNumber.toUpperCase().trim(),
        drugLicenseNo,
      },
    });

    res.status(201).json({
      success: true,
      message: `Branch ${branch.name} onboarded successfully`,
      data: branch,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, city, state, pincode, phone, email, gstNumber, drugLicenseNo, isActive } = req.body;

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(address !== undefined && { address }),
        ...(city && { city }),
        ...(state && { state }),
        ...(pincode && { pincode }),
        ...(phone && { phone }),
        ...(email !== undefined && { email }),
        ...(gstNumber && { gstNumber: gstNumber.toUpperCase().trim() }),
        ...(drugLicenseNo && { drugLicenseNo }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({
      success: true,
      data: branch,
      message: 'Branch details updated',
    });
  } catch (error) {
    next(error);
  }
};
