import { Router } from 'express';
import {
  createPurchase,
  listPurchases,
  getPurchaseById,
  simulateOcrScan,
} from '../controllers/purchase.controller.js';

const router = Router();

router.get('/', listPurchases);
router.post('/', createPurchase);
router.post('/ocr-scan', simulateOcrScan);
router.get('/:id', getPurchaseById);

export default router;
