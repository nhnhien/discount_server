import express from 'express';
import { addToCart, clearCart, getCart, removeFromCart, updateCartItem } from '../controller/cart/cart.controller.js';

const router = express.Router();

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:id', updateCartItem);
router.delete('/:id', removeFromCart);
router.delete('/apply', clearCart);

export default router;
