import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
  updateDelivery,
  cancelOrder,
  getOrderStatistics,
} from '../controller/order/order.controller.js';
import verifyFirebaseToken from '../middleware/auth.middleware.js'; // 👈 Thêm dòng này

const router = express.Router();
router.use(verifyFirebaseToken);
router.get('/', getOrders);
router.get('/statistics', getOrderStatistics);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);
// router.patch('/:id/payment', updatePaymentStatus);
// router.patch('/:id/delivery', updateDelivery);
router.delete('/:id', cancelOrder);

export default router;