import { Router } from 'express';
import * as salesController from '../controllers/sales.controller.js';
import { buildThermalReceipt } from '../../shared/services/thermal-receipt.service.js';
import { prisma } from '../../shared/config/db.js';
import { AppError } from '../../shared/errors/AppError.js';

const router = Router();

router.get('/', salesController.getSales);
router.post('/', salesController.createSale);
router.get('/:id', salesController.getSaleDetails);
router.post('/:id/cancel', salesController.cancelSale);

/**
 * GET /api/store/sales/:id/thermal-receipt?width=80
 * Returns raw ESC/POS binary buffer for thermal receipt printing
 */
router.get('/:id/thermal-receipt', async (req, res, next) => {
  try {
    const { id } = req.params;
    const paperWidth = parseInt(req.query.width) === 58 ? 58 : 80;

    const sale = await prisma.sale.findFirst({
      where: { id, branchId: req.branchId },
      include: {
        items: {
          include: {
            medicine: { select: { name: true, genericName: true } },
          },
        },
        customer: true,
        billedBy: { select: { name: true } },
        branch: true,
      },
    });

    if (!sale) {
      return next(new AppError('Sale invoice not found', 404, 'NOT_FOUND'));
    }

    const buffer = buildThermalReceipt(sale, sale.branch, paperWidth);

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="receipt_${sale.billNumber}.bin"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

export default router;
