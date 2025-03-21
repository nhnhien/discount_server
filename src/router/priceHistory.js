import express from 'express';
import {
  getProductPriceHistory,
  getVariantPriceHistory,
  getAllPriceHistory,
} from '../controller/product/priceHistory.controller.js';

const router = express.Router();

router.get('/products/:product_id', getProductPriceHistory);
router.get('/variants/:variant_id/', getVariantPriceHistory);
router.get('/', getAllPriceHistory);

export default router;
