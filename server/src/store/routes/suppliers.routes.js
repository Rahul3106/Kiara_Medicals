import { Router } from 'express';
import { listSuppliers, createSupplier } from '../controllers/supplier.controller.js';

const router = Router();

router.get('/', listSuppliers);
router.post('/', createSupplier);

export default router;
