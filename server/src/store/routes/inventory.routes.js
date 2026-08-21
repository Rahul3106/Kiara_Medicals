import { Router } from 'express';
import {
  getInventory,
  getMasterMedicines,
  searchMedicinesForPOS,
  getNearExpiry,
  getLowStock,
  adjustStock,
} from '../controllers/inventory.controller.js';

const router = Router();

router.get('/', getInventory);
router.get('/medicines-catalog', getMasterMedicines);
router.post('/adjust', adjustStock);
router.get('/medicine-search', searchMedicinesForPOS);
router.get('/low-stock', getLowStock);
router.get('/near-expiry', getNearExpiry);

export default router;
