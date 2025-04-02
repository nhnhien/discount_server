import express from 'express';
import { processPayment, handleVnpayCallback, repayment } from '../controller/payment/payment.controller.js';

const router = express.Router();

router.post('/process', processPayment);
router.get('/vnpay-return', handleVnpayCallback);
router.post('/repayment', repayment);

export default router;