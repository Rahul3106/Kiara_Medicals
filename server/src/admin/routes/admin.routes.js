import { Router } from 'express';
import { verifyToken } from '../../shared/auth/auth.middleware.js';
import { requireAdmin } from '../middleware/requireAdmin.middleware.js';
import {
  getAdminSummary,
  getBranchComparison,
} from '../controllers/adminDashboard.controller.js';
import { listBranches, createBranch, updateBranch } from '../controllers/branch.controller.js';
import { listUsers, createUser, updateUser } from '../controllers/user.controller.js';
import {
  getConsolidatedInventory,
  createMasterMedicine,
  getConsolidatedSales,
  getGlobalExpiryOverview,
  getSystemAuditLogs,
} from '../controllers/adminOperations.controller.js';

const router = Router();

// Protect ALL admin routes with JWT and Super Admin verification
router.use(verifyToken, requireAdmin);

// Dashboard and Consolidated Analytics
router.get('/dashboard/summary', getAdminSummary);
router.get('/dashboard/branch-comparison', getBranchComparison);

// Branch Management
router.get('/branches', listBranches);
router.post('/branches', createBranch);
router.patch('/branches/:id', updateBranch);

// User Management
router.get('/users', listUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);

// Operations: Consolidated Inventory & Master Catalog
router.get('/inventory/consolidated', getConsolidatedInventory);
router.post('/inventory/master', createMasterMedicine);

// Operations: Consolidated Sales
router.get('/sales/consolidated', getConsolidatedSales);

// Operations: Global Expiry Monitor
router.get('/expiry/overview', getGlobalExpiryOverview);

// Operations: Audit Logs & Compliance
router.get('/audit-logs', getSystemAuditLogs);

export default router;
