import express from 'express';
import { createProduct, getProduct } from '../controller/product/product.controller.js';

const router = express.Router();

router.get('/', getProduct);
router.post('/', createProduct);

export default router;