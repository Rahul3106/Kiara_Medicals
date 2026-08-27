import { Router } from 'express';
import * as salesController from '../controllers/sales.controller.js';

const router = Router();

router.get('/', salesController.getSales);
router.post('/', salesController.createSale);
router.get('/:id', salesController.getSaleDetails);
router.post('/:id/cancel', salesController.cancelSale);

export default router;
