import express from 'express';
import { uploadFileStorage } from '../controller/upload/upload.controller.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

router.post('/', upload.single('image'), uploadFileStorage);

export default router;