import admin from '../config/firebase.config.js';
import { User } from '../models/index.js';

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: Thiếu token' });
    }

    const idToken = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // 🔍 Safe debug token
    console.log('[Middleware] Firebase decoded token:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      phone: decodedToken.phone_number,
      name: decodedToken.name,
    });

    const firebase_uid = decodedToken.uid;
    if (!firebase_uid) {
      return res.status(403).json({ message: 'Token không hợp lệ: thiếu UID' });
    }

    // 👉 Fallback name hợp lý
    const fallbackName =
      decodedToken.name ||
      (decodedToken.email ? decodedToken.email.split('@')[0] : null) ||
      decodedToken.phone_number ||
      `user-${firebase_uid.slice(-4)}`;

    // 🔎 Tìm user theo firebase_uid
    let userRecord = await User.findOne({ where: { firebase_uid } });

    // ✅ Nếu chưa có, tạo mới user
    if (!userRecord) {
      userRecord = await User.create({
        firebase_uid,
        email: decodedToken.email || null,
        name: fallbackName,
        phone: decodedToken.phone_number || null,
        avatar: decodedToken.picture || null,
        role_id: 2, // Customer
        is_active: true,
      });
    }

    // ❌ Nếu user bị khóa
    if (userRecord.is_active === false) {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa' });
    }

    // ✅ Gắn vào req.user
    req.user = {
      id: userRecord.id,
      uid: firebase_uid,
      email: userRecord.email,
      username: userRecord.name,
      phone: userRecord.phone,
      avatar: userRecord.avatar,
      role: userRecord.role_id === 1 ? 'admin' : 'customer',
    };

    console.log('[Middleware] ✅ Xác thực thành công. User ID:', req.user.id);
    next();
  } catch (error) {
    console.error('[Middleware] ❌ Lỗi xác thực Firebase:', error);
    return res.status(403).json({
      message: 'Token không hợp lệ',
      error: error.message,
    });
  }
};

export default verifyFirebaseToken;