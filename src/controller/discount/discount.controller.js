import { Discount, Product, Category, Variant } from '../../models/index.js';

export const getAllDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.findAll({
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Variant, as: 'variant', attributes: ['id', 'sku'] },
      ],
    });

    res.status(200).json({
      success: true,
      data: discounts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách giảm giá',
      error: error.message,
    });
  }
};

export const getDiscountById = async (req, res) => {
  try {
    const { id } = req.params;
    const discount = await Discount.findByPk(id, {
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Variant, as: 'variant', attributes: ['id', 'sku'] },
      ],
    });

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá',
      });
    }

    res.status(200).json({
      success: true,
      data: discount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy mã giảm giá',
      error: error.message,
    });
  }
};

// Tạo mã giảm giá mới
export const createDiscount = async (req, res) => {
  try {
    const {
      discount_code,
      discount_type,
      value,
      start_date,
      end_date,
      apply_to_product_id,
      apply_to_variant_id,
      apply_to_category_id,
    } = req.body;

    if (!discount_code || !discount_type || !value || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin cần thiết',
      });
    }

    if (apply_to_product_id) {
      const productExists = await Product.findByPk(apply_to_product_id);
      if (!productExists) return res.status(400).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    if (apply_to_variant_id) {
      const variantExists = await Variant.findByPk(apply_to_variant_id);
      if (!variantExists) return res.status(400).json({ success: false, message: 'Biến thể không tồn tại' });
    }

    if (apply_to_category_id) {
      const categoryExists = await Category.findByPk(apply_to_category_id);
      if (!categoryExists) return res.status(400).json({ success: false, message: 'Danh mục không tồn tại' });
    }

    const discount = await Discount.create({
      discount_code,
      discount_type,
      value,
      start_date,
      end_date,
      apply_to_product_id,
      apply_to_variant_id,
      apply_to_category_id,
    });

    res.status(201).json({
      success: true,
      message: 'Tạo mã giảm giá thành công',
      data: discount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo mã giảm giá',
      error: error.message,
    });
  }
};

export const updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      discount_code,
      discount_type,
      value,
      start_date,
      end_date,
      apply_to_product_id,
      apply_to_variant_id,
      apply_to_category_id,
    } = req.body;

    const discount = await Discount.findByPk(id);
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá',
      });
    }

    if (apply_to_product_id) {
      const productExists = await Product.findByPk(apply_to_product_id);
      if (!productExists) return res.status(400).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    if (apply_to_variant_id) {
      const variantExists = await Variant.findByPk(apply_to_variant_id);
      if (!variantExists) return res.status(400).json({ success: false, message: 'Biến thể không tồn tại' });
    }

    if (apply_to_category_id) {
      const categoryExists = await Category.findByPk(apply_to_category_id);
      if (!categoryExists) return res.status(400).json({ success: false, message: 'Danh mục không tồn tại' });
    }

    await discount.update({
      discount_code,
      discount_type,
      value,
      start_date,
      end_date,
      apply_to_product_id,
      apply_to_variant_id,
      apply_to_category_id,
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật mã giảm giá thành công',
      data: discount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật mã giảm giá',
      error: error.message,
    });
  }
};

export const deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const discount = await Discount.findByPk(id);
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá',
      });
    }

    await discount.destroy();

    res.status(200).json({
      success: true,
      message: 'Xóa mã giảm giá thành công',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa mã giảm giá',
      error: error.message,
    });
  }
};
