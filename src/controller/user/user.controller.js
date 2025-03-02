import User from '../../models/user.js';
const getUser = async (req, res) => {
  try {
    const user = await User.findAll();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const createUser = async (req, res) => {
  res.status(200).json({ message: 'Create user' });
};
const updateUser = async (req, res) => {
  res.status(200).json({ message: 'Update user' });
};
const deleteUser = async (req, res) => {};
export { getUser, createUser, updateUser, deleteUser };