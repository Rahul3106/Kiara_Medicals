import { prisma } from '../config/db.js';
import { comparePassword } from './password.util.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from './token.util.js';
import { AppError } from '../errors/AppError.js';

/**
 * Common Login Handler
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400, 'MISSING_CREDENTIALS'));
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { branch: true },
    });

    if (!user) {
      return next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
    }

    if (!user.isActive) {
      return next(new AppError('Account is disabled. Please contact administrator.', 403, 'ACCOUNT_DISABLED'));
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ userId: user.id });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          branchId: user.branchId,
          branch: user.branch,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Login (Super Admin Portal)
 */
export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400, 'MISSING_CREDENTIALS'));
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { branch: true },
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return next(
        new AppError('Access denied: Unauthorized admin credentials', 403, 'ADMIN_ACCESS_DENIED')
      );
    }

    if (!user.isActive) {
      return next(new AppError('Account is disabled', 403, 'ACCOUNT_DISABLED'));
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      branchId: null,
    });
    const refreshToken = generateRefreshToken({ userId: user.id });

    res.status(200).json({
      success: true,
      message: 'Admin authentication successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          branchId: null,
          branch: null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Store / Branch Staff Login
 */
export const storeLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400, 'MISSING_CREDENTIALS'));
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { branch: true },
    });

    if (!user) {
      return next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
    }

    if (user.role === 'SUPER_ADMIN') {
      return next(
        new AppError('Super Admin accounts must use the Admin portal', 403, 'USE_ADMIN_PORTAL')
      );
    }

    if (!user.branchId || !user.branch) {
      return next(
        new AppError('User is not assigned to any active store branch', 403, 'NO_BRANCH_ASSIGNED')
      );
    }

    if (!user.branch.isActive) {
      return next(
        new AppError('This store branch is currently inactive', 403, 'BRANCH_INACTIVE')
      );
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    });
    const refreshToken = generateRefreshToken({ userId: user.id });

    res.status(200).json({
      success: true,
      message: `Logged in to ${user.branch.name}`,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          branchId: user.branchId,
          branch: user.branch,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Token Refresh Handler
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return next(new AppError('Refresh token is required', 400, 'MISSING_REFRESH_TOKEN'));
    }

    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { branch: true },
    });

    if (!user || !user.isActive) {
      return next(new AppError('User session is invalid or expired', 401, 'INVALID_SESSION'));
    }

    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    next(new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN'));
  }
};

/**
 * Get Current User Profile & Active Context
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        isActive: true,
        lastLoginAt: true,
        branch: true,
      },
    });

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout Handler
 */
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};
