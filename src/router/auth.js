import express from 'express';
import { syncUser } from '../controller/user/user.controller.js';
import admin from '../config/firebase.config.js';

const router = express.Router();

router.post('/sync-user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: Thiếu token' });
    }

    const idToken = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // 🔐 Fallback name bảo vệ null
    const fallbackName =
      decodedToken.name ||
      (decodedToken.email ? decodedToken.email.split('@')[0] : null) ||
      decodedToken.phone_number ||
      `user-${decodedToken.uid.slice(-4)}`;

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      username: fallbackName,
      phone: decodedToken.phone_number || null,
      avatar: decodedToken.picture || null,
    };

    // Gọi controller
    return syncUser(req, res);
  } catch (error) {
    console.error('[Auth] ❌ Lỗi xác thực Firebase:', error.message);
    return res.status(403).json({ message: 'Token không hợp lệ', error: error.message });
  }
});

export default router;