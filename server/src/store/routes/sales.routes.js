import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, branchId: req.branchId, message: 'Branch sales history' });
});

router.post('/', (req, res) => {
  res.json({ success: true, branchId: req.branchId, message: 'Create POS sale and generate GST bill' });
});

router.get('/:id', (req, res) => {
  res.json({ success: true, branchId: req.branchId, message: `Get sale bill ${req.params.id}` });
});

router.get('/:id/invoice-pdf', (req, res) => {
  res.json({ success: true, branchId: req.branchId, message: `Generate PDF for sale ${req.params.id}` });
});

router.post('/:id/cancel', (req, res) => {
  res.json({ success: true, branchId: req.branchId, message: `Cancel sale ${req.params.id} and revert stock` });
});

export default router;
