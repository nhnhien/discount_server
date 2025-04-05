import express from 'express';
import { getProductComparison, getHistoricalComparisons } from '../controller/product/priceComparison.controller.js';
import verifyFirebaseToken from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply Firebase authentication middleware
router.use(verifyFirebaseToken);

// Current comparison routes
router.get('/product/:product_id', getProductComparison);
router.get('/product/:product_id/variant/:variant_id', getProductComparison);

// Historical comparison routes
router.get('/history/product/:product_id/:days?', getHistoricalComparisons);
router.get('/history/product/:product_id/variant/:variant_id/:days?', getHistoricalComparisons);

export default router;