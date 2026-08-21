import { AppError } from '../../shared/errors/AppError.js';

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }

  if (req.user.role !== 'SUPER_ADMIN') {
    return next(new AppError('Access denied: Requires Super Admin privilege', 403, 'FORBIDDEN'));
  }

  next();
};
