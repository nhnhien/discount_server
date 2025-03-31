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
    const userRecord = await User.findOne({
      where: {
        firebase_uid: decodedToken.uid,
      },
    });

    if (!userRecord) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
    }
    req.user = {
      id: userRecord.id,
      uid: decodedToken.uid,
      email: decodedToken.email,
      username: decodedToken.name || decodedToken.email.split('@')[0],
      phone: decodedToken.phone_number || null,
      avatar: decodedToken.picture || null,
    };

    next();
  } catch (error) {
    console.error('Lỗi xác thực Firebase:', error);
    return res.status(403).json({ message: 'Token không hợp lệ', error: error.message });
  }
};

export default verifyFirebaseToken;
