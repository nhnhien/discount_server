import User from '../../models/user.js';
import { Op } from 'sequelize';

const getUser = async (req, res) => {
  try {
    const user = await User.findAll();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getCustomer = async (req, res) => {
  try {
    const customers = await User.findAll({
      where: {
        role_id: 2,
        // is_active: true,
      },
    });
    

    if (customers.length === 0) {
      return res.status(404).json({
        success: true,
        message: 'No customers found',
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customers retrieved successfully',
      data: customers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving customers',
      error: error.message,
    });
  }
};

const syncUser = async (req, res) => {
  try {
    const { uid, email, username, phone, avatar } = req.user;

    // ✅ Fallback tên hợp lý
    const fallbackUsername =
      username ||
      (email ? email.split('@')[0] : phone || `user-${uid.slice(-4)}`);

    let user = await User.findOne({ where: { firebase_uid: uid } });

    if (!user) {
      user = await User.create({
        firebase_uid: uid,
        email: email || null,
        name: fallbackUsername,
        phone: phone || null,
        avatar: avatar || null,
        role_id: 2, // Khách hàng mặc định
        is_active: true,
      });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('[syncUser] ❌ Lỗi đồng bộ:', error);
    return res.status(500).json({
      message: 'Lỗi đồng bộ user',
      error: error.message,
    });
  }
};





const createUser = async (req, res) => {
  res.status(200).json({ message: 'Create user' });
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { phone } = req.body;

    const currentUser = await User.findByPk(id);
    if (!currentUser) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Nếu tài khoản đăng nhập bằng SĐT (không có email), không cho sửa SĐT
    if (!currentUser.email && phone !== currentUser.phone) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đăng nhập bằng số điện thoại không thể cập nhật số điện thoại',
      });
    }

    // Kiểm tra trùng số điện thoại
    if (phone && phone !== currentUser.phone) {
      const existed = await User.findOne({
        where: {
          phone,
          id: { [Op.ne]: id },
        },
      });

      if (existed) {
        return res.status(400).json({ message: 'Số điện thoại đã được sử dụng' });
      }

      await currentUser.update({ phone });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      data: currentUser,
    });
  } catch (error) {
    console.error('updateUser error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật hồ sơ',
      error: error.message,
    });
  }
};





const deleteUser = async (req, res) => {};
const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    await user.update({ is_active: false });

    return res.status(200).json({
      success: true,
      message: 'Đã khóa tài khoản người dùng',
      data: { id, is_active: false },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi khóa tài khoản', error: error.message });
  }
};

const reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    await user.update({ is_active: true });

    return res.status(200).json({
      success: true,
      message: 'Đã kích hoạt lại tài khoản người dùng',
      data: { id, is_active: true },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi kích hoạt tài khoản', error: error.message });
  }
};
export { getUser, createUser, updateUser, deleteUser, syncUser, getCustomer, deactivateUser, reactivateUser };