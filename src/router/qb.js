// routes/quantityBreakRoutes.js
import express from 'express';
import {
  getQuantityBreaks,
  getQuantityBreakById,
  createQuantityBreak,
  updateQuantityBreak,
  deleteQuantityBreak,
  calculatePrice,
  getQuantityBreaksByProduct,
  getQuantityBreaksByVariant,
} from '../controller/quantity-break/qb.controller.js';

const router = express.Router();

router.get('/calculate-price', calculatePrice);
router.get('/products/:product_id', getQuantityBreaksByProduct);
router.get('/variants/:variant_id', getQuantityBreaksByVariant);

router.get('/', getQuantityBreaks);
router.get('/:id', getQuantityBreakById);
router.post('/', createQuantityBreak);
router.put('/:id', updateQuantityBreak);
router.delete('/:id', deleteQuantityBreak);

export default router;
