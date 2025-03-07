import express from 'express';
import { getMarket } from '../controller/market/market.controller.js';

const router = express.Router();

router.get('/', getMarket);

export default router;