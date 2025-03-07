import express from 'express';
import {
    createProduct,
    deleteProduct,
    getProduct,
    getProductById,
    updateProduct,
  } from '../controller/product/product.controller.js';

const router = express.Router();

router.get('/:id', getProductById);
router.get('/', getProduct);
router.post('/', createProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;