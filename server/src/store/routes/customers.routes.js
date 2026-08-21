import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, branchId: req.branchId, message: 'List branch customers' });
});

router.post('/', (req, res) => {
  res.json({ success: true, branchId: req.branchId, message: 'Create / update customer' });
});

export default router;
