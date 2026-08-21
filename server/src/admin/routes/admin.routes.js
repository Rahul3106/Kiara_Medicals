import { Router } from 'express';
import { verifyToken } from '../../shared/auth/auth.middleware.js';
import { requireAdmin } from '../middleware/requireAdmin.middleware.js';
import {
  getAdminSummary,
  getBranchComparison,
} from '../controllers/adminDashboard.controller.js';
import { listBranches, createBranch } from '../controllers/branch.controller.js';
import { listUsers, createUser } from '../controllers/user.controller.js';

const router = Router();

// Protect ALL admin routes with JWT and Super Admin verification
router.use(verifyToken, requireAdmin);

// Dashboard and Consolidated Analytics
router.get('/dashboard/summary', getAdminSummary);
router.get('/dashboard/branch-comparison', getBranchComparison);

// Branch Management
router.get('/branches', listBranches);
router.post('/branches', createBranch);

// User Management
router.get('/users', listUsers);
router.post('/users', createUser);

export default router;
