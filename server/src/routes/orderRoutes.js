import { Router } from 'express';
import { validateStock, createOrder, listClientOrders } from '../controllers/orderController.js';

const router = Router();

router.post('/cart/validate', validateStock);
router.post('/orders', createOrder);
router.get('/clients/:email/orders', listClientOrders);

export default router;