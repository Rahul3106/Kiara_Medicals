import { Router } from 'express';

const router = Router();

router.get('/daily', (req, res) => {
  res.json({ success: true, branchId: req.branchId, message: 'Branch daily sales summary' });
});

router.get('/weekly', (req, res) => {
  res.json({ success: true, branchId: req.branchId, message: 'Branch weekly sales trends' });
});

router.get('/monthly', (req, res) => {
  res.json({ success: true, branchId: req.branchId, message: 'Branch monthly GST report' });
});

router.get('/fast-moving', (req, res) => {
  res.json({ success: true, branchId: req.branchId, message: 'Branch top selling medicines' });
});

export default router;
