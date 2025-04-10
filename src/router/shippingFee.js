import express from 'express';
import {
    getAllShippingFees,
    getShippingFeeById,
    createShippingFee,
    updateShippingFee,
    deleteShippingFee,
    toggleShippingFee,
  } from '../controller/shipping/shippingFee.controller.js';
import verifyFirebaseToken from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', verifyFirebaseToken, getAllShippingFees);
router.get('/:id', verifyFirebaseToken, getShippingFeeById);
router.post('/', verifyFirebaseToken, createShippingFee);
router.put('/:id', verifyFirebaseToken, updateShippingFee);
router.patch('/:id/toggle', verifyFirebaseToken, toggleShippingFee);
router.delete('/:id', verifyFirebaseToken, deleteShippingFee);

export default router;
