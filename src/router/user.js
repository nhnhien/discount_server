import express from 'express';
import { createUser, deleteUser, getCustomer, getUser, updateUser } from '../controller/user/user.controller.js';

const router = express.Router();

router.get('/', getUser);
router.get('/customer', getCustomer);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;