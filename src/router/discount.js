import express from 'express';
import {
  getAllDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from '../controller/discount/discount.controller.js';

const router = express.Router();

router.get('/:id', getDiscountById);
router.get('/', getAllDiscounts);
router.post('/', createDiscount);
router.put('/:id', updateDiscount);
router.delete('/:id', deleteDiscount);

export default router;
