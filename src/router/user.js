import express from 'express';
import {
  createUser,
  deleteUser,
  getCustomer,
  getUser,
  updateUser,
  deactivateUser,
  reactivateUser,
} from '../controller/user/user.controller.js';

const router = express.Router();

router.get('/', getUser);
router.get('/customer', getCustomer);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.patch('/:id/deactivate', deactivateUser);
router.patch('/:id/reactivate', reactivateUser); 
router.delete('/:id', deleteUser);

export default router;