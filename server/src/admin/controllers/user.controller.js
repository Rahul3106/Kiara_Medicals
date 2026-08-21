import { prisma } from '../../shared/config/db.js';
import { hashPassword } from '../../shared/auth/password.util.js';
import { AppError } from '../../shared/errors/AppError.js';

export const listUsers = async (req, res, next) => {
  try {
    const { branchId, role } = req.query;
    const where = {};
    if (branchId) where.branchId = branchId;
    if (role) where.role = role;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        branch: {
          select: { id: true, name: true, code: true, city: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, branchId } = req.body;

    if (!name || !email || !password || !role) {
      return next(new AppError('Please provide name, email, password, and role', 400, 'MISSING_FIELDS'));
    }

    if (role !== 'SUPER_ADMIN' && !branchId) {
      return next(new AppError('Store managers and staff must be assigned to a branch', 400, 'BRANCH_REQUIRED'));
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return next(new AppError('A user with this email already exists', 409, 'EMAIL_EXISTS'));
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        phone,
        role,
        branchId: role === 'SUPER_ADMIN' ? null : branchId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'User account created successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
