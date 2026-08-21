import { Router } from 'express';
import { verifyToken } from '../../shared/auth/auth.middleware.js';
import { requireBranchScope } from '../middleware/requireBranchScope.middleware.js';

import inventoryRoutes from './inventory.routes.js';
import purchaseRoutes from './purchase.routes.js';
import salesRoutes from './sales.routes.js';
import customersRoutes from './customers.routes.js';
import suppliersRoutes from './suppliers.routes.js';
import reportsRoutes from './reports.routes.js';

const router = Router();

// Protect ALL store routes with authentication and strict branch scoping
router.use(verifyToken, requireBranchScope);

router.use('/inventory', inventoryRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/sales', salesRoutes);
router.use('/customers', customersRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/reports', reportsRoutes);

export default router;
