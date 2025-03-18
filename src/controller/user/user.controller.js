import User from '../../models/user.js';
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
      where: { role_id: 2 },
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

    let user = await User.findOne({ where: { firebase_uid: uid } });

    if (!user) {
      user = await User.create({
        firebase_uid: uid,
        email,
        name: username,
        phone,
        avatar,
        role_id: 2,
      });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi đồng bộ user', error: error.message });
  }
};

const createUser = async (req, res) => {
  res.status(200).json({ message: 'Create user' });
};
const updateUser = async (req, res) => {
  res.status(200).json({ message: 'Update user' });
};
const deleteUser = async (req, res) => {};
export { getUser, createUser, updateUser, deleteUser, syncUser, getCustomer };