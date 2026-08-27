import { Router } from 'express';
import * as reportsController from '../controllers/reports.controller.js';

const router = Router();

router.get('/overview', reportsController.getReportsOverview);
router.get('/gst-summary', reportsController.getGstSummary);
router.get('/stock-movement', reportsController.getStockMovement);
router.get('/', reportsController.getReportsOverview);

export default router;
