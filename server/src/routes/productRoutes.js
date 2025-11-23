import { Router } from 'express';
import { importProducts, listProducts, getProductDetails } from '../controllers/productController.js';

const router = Router();

router.post('/products/import', importProducts);
router.get('/products', listProducts);
router.get('/products/:id', getProductDetails);

export default router;