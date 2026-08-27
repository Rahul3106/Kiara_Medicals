import { Router } from 'express';
import * as customerController from '../controllers/customer.controller.js';

const router = Router();

router.get('/', customerController.getCustomers);
router.get('/search', customerController.searchCustomers);
router.post('/', customerController.saveCustomer);
router.get('/:id', customerController.getCustomerDetails);

export default router;
