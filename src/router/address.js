import express from 'express';
import { getUserAddresses, createAddress, updateAddress, deleteAddress } from '../controller/address/address.controller.js';
import verifyFirebaseToken from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyFirebaseToken);

router.get('/', getUserAddresses);
router.post('/', createAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);

export default router;
