import { Category } from '../../models/index.js';

const getCategory = async (req, res) => {
  try {
    const category = await Category.findAll({});
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.create({ name, description });
  } catch (error) {}
};

export { getCategory, createCategory };