import { AppError } from '../../shared/errors/AppError.js';
import { getScopedPrisma } from '../../shared/services/scopedPrisma.service.js';

export const requireBranchScope = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }

  // If user is not SUPER_ADMIN, they MUST have an active branchId
  if (req.user.role !== 'SUPER_ADMIN') {
    if (!req.user.branchId) {
      return next(new AppError('User is not assigned to any branch', 403, 'NO_BRANCH_ASSIGNED'));
    }
    // Hard lock the branch context on the request object from the verified token
    req.branchId = req.user.branchId;
  } else {
    // Super admin can select/switch branch via header or query if accessing store endpoints
    req.branchId = req.headers['x-branch-id'] || req.query.branchId || req.user.branchId;
    if (!req.branchId) {
      return next(
        new AppError(
          'Branch context required. Please select a branch or provide x-branch-id header',
          400,
          'BRANCH_CONTEXT_REQUIRED'
        )
      );
    }
  }

  // Attach database query-level isolation helper
  req.scopedPrisma = getScopedPrisma(req.branchId);

  next();
};
