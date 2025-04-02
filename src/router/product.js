import express from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProductById,
  updateProduct,
} from '../controller/product/product.controller.js';
import verifyFirebaseToken from '../middleware/auth.middleware.js';

const router = express.Router();

// ✅ Áp dụng middleware xác thực Firebase cho tất cả route trong file này
router.use(verifyFirebaseToken);

// Các route cần sử dụng req.user sẽ luôn có sau middleware
router.get('/:id', getProductById);
router.get('/', getProduct);
router.post('/', createProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;