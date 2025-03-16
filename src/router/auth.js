import express from 'express';
 import { syncUser } from '../controller/user/user.controller.js';
 import verifyFirebaseToken from '../middleware/auth.middleware.js';
 
 const router = express.Router();
 
 router.post('/sync-user', verifyFirebaseToken, syncUser);
 
 export default router;