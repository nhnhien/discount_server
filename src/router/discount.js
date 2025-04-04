import express from 'express';
import {
  getAllDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  validateDiscountCode,
  getAvailableDiscounts, // ✅ thêm dòng này
} from '../controller/discount/discount.controller.js';

const router = express.Router();

// ✅ Đặt các route cụ thể lên trước
router.get('/available', getAvailableDiscounts); // ✅ thêm dòng này trước router.get('/:id')
router.post('/validate', validateDiscountCode);

router.get('/', getAllDiscounts);
router.get('/:id', getDiscountById);
router.post('/', createDiscount);
router.put('/:id', updateDiscount);
router.delete('/:id', deleteDiscount);

export default router;