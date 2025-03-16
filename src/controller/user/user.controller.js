import User from '../../models/user.js';
const getUser = async (req, res) => {
  try {
    const user = await User.findAll();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
export { getUser, createUser, updateUser, deleteUser, syncUser };