import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { prisma } from '../config/db.js';
import { AppError } from '../errors/AppError.js';

export const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    // 1. Priority: Extract from secure HttpOnly cookie
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // 2. Fallback: Extract from Authorization header (Bearer token)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('No authorization token provided', 401, 'UNAUTHORIZED'));
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { branch: true },
    });

    if (!user || !user.isActive) {
      return next(new AppError('User not found or account is deactivated', 401, 'UNAUTHORIZED'));
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      branch: user.branch,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Invalid authentication token', 401, 'INVALID_TOKEN'));
  }
};
