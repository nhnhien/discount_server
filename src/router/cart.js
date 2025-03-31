import express from 'express';
import { addToCart, clearCart, getCart, removeFromCart, updateCartItem } from '../controller/cart/cart.controller.js';
import verifyFirebaseToken from '../middleware/auth.middleware.js';
const router = express.Router();

router.get('/', verifyFirebaseToken, getCart);
 router.post('/', verifyFirebaseToken, addToCart);
 router.put('/:id', verifyFirebaseToken, updateCartItem);
 router.delete('/:id', verifyFirebaseToken, removeFromCart);
 router.delete('/apply', verifyFirebaseToken, clearCart);

export default router;
