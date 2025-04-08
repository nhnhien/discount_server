import { Discount, Product, Variant, User, sequelize } from '../../models/index.js';
import { Op } from 'sequelize';

export const getAllDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.findAll({
      include: [
        { model: Product, as: 'products', through: { attributes: [] } },
        { model: Variant, as: 'variants', through: { attributes: [] } },
        { model: User, as: 'customers', through: { attributes: [] } },
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
        { model: Product, as: 'products', through: { attributes: [] } },
        { model: Variant, as: 'variants', through: { attributes: [] } },
        { model: User, as: 'customers', through: { attributes: [] } },
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

export const createDiscount = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      discount_code,
      title,
      description,
      discount_type,
      value,
      min_order_amount,
      max_discount_amount,
      usage_limit,
      is_active,
      start_date,
      end_date,
      product_ids = [],
      variant_ids = [],
      user_ids = [],
    } = req.body;

    if (!discount_code || !discount_type || !value || !start_date) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin cần thiết',
      });
    }
    const discount = await Discount.create(
      {
        discount_code,
        title,
        description,
        discount_type,
        value,
        min_order_amount,
        max_discount_amount,
        usage_limit,
        usage_count: 0,
        is_active: is_active !== undefined ? is_active : true,
        start_date,
        end_date,
      },
      { transaction }
    );
    if (product_ids && product_ids.length > 0) {
      await discount.setProducts(product_ids, { transaction });
    }
    if (variant_ids && variant_ids.length > 0) {
      await discount.setVariants(variant_ids, { transaction });
    }
    if (user_ids && user_ids.length > 0) {
      await discount.setCustomers(user_ids, { transaction });
    }

    await transaction.commit();
    const createdDiscount = await Discount.findByPk(discount.id, {
      include: [
        { model: Product, as: 'products', through: { attributes: [] } },
        { model: Variant, as: 'variants', through: { attributes: [] } },
        { model: User, as: 'customers', through: { attributes: [] } },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Tạo mã giảm giá thành công',
      data: createdDiscount,
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo mã giảm giá',
      error: error.message,
    });
  }
};

export const updateDiscount = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      discount_code,
      title,
      description,
      discount_type,
      value,
      min_order_amount,
      max_discount_amount,
      usage_limit,
      is_active,
      start_date,
      end_date,
      product_ids,
      variant_ids,
      user_ids,
    } = req.body;

    const discount = await Discount.findByPk(id);
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá',
      });
    }
    await discount.update(
      {
        discount_code,
        title,
        description,
        discount_type,
        value,
        min_order_amount,
        max_discount_amount,
        usage_limit,
        is_active,
        start_date,
        end_date,
      },
      { transaction }
    );
    if (product_ids !== undefined) {
      await discount.setProducts(product_ids || [], { transaction });
    }

    if (variant_ids !== undefined) {
      await discount.setVariants(variant_ids || [], { transaction });
    }

    if (user_ids !== undefined) {
      await discount.setCustomers(user_ids || [], { transaction });
    }

    await transaction.commit();
    const updatedDiscount = await Discount.findByPk(id, {
      include: [
        { model: Product, as: 'products', through: { attributes: [] } },
        { model: Variant, as: 'variants', through: { attributes: [] } },
        { model: User, as: 'customers', through: { attributes: [] } },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật mã giảm giá thành công',
      data: updatedDiscount,
    });
  } catch (error) {
    await transaction.rollback();
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

export const validateDiscountCode = async (req, res) => {
  try {
    const { discount_code, product_id, variant_id, user_id, order_amount } = req.body;

    if (!discount_code) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã giảm giá',
      });
    }

    const discount = await Discount.findOne({
      where: {
        discount_code,
        is_active: true,
        start_date: { [Op.lte]: new Date() },
        end_date: { [Op.gte]: new Date() },
      },
      include: [
        { model: Product, as: 'products', through: { attributes: [] } },
        { model: Variant, as: 'variants', through: { attributes: [] } },
        { model: User, as: 'customers', through: { attributes: [] } },
      ],
    });

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Mã giảm giá không tồn tại hoặc đã hết hạn',
      });
    }

    if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá đã hết lượt sử dụng',
      });
    }

    const numericOrderAmount = parseFloat(order_amount);
    if (discount.min_order_amount && numericOrderAmount < discount.min_order_amount) {
      return res.status(400).json({
        success: false,
        message: `Giá trị đơn hàng tối thiểu để sử dụng mã giảm giá là ${discount.min_order_amount}`,
      });
    }

    let isApplicable = true;

    const productMatched = discount.products?.some((p) => Number(p.id) === Number(product_id));
    const variantMatched = variant_id && discount.variants?.some((v) => Number(v.id) === Number(variant_id));

    if (
      (discount.products.length > 0 || discount.variants.length > 0) &&
      !productMatched &&
      !variantMatched
    ) {
      isApplicable = false;
    }

    if (
      discount.customers.length > 0 &&
      !discount.customers.some((u) => Number(u.id) === Number(user_id))
    ) {
      isApplicable = false;
    }

    if (!isApplicable) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá không áp dụng cho sản phẩm, biến thể hoặc tài khoản này',
      });
    }

    let discountAmount = 0;

    switch (discount.discount_type) {
      case 'percentage':
        discountAmount = (numericOrderAmount * discount.value) / 100;
        break;
      case 'fixed':
        discountAmount = discount.value;
        break;
      case 'free_shipping':
        discountAmount = 'free_shipping';
        break;
    }

    if (
      typeof discountAmount === 'number' &&
      discount.max_discount_amount &&
      discountAmount > discount.max_discount_amount
    ) {
      discountAmount = discount.max_discount_amount;
    }

    await discount.update({
      usage_count: discount.usage_count + 1,
    });

    res.status(200).json({
      success: true,
      message: 'Áp dụng mã giảm giá thành công',
      data: {
        discount_code: discount.discount_code,
        discount_type: discount.discount_type,
        discount_amount: discountAmount,
        final_amount:
          discountAmount === 'free_shipping'
            ? numericOrderAmount
            : numericOrderAmount - discountAmount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi áp dụng mã giảm giá',
      error: error.message,
    });
  }
};

// GET /api/discounts/available?user_id=2
export const getAvailableDiscounts = async (req, res) => {
  const userId = Number(req.query.user_id);

  const discounts = await Discount.findAll({
    where: {
      is_active: true,
      start_date: { [Op.lte]: new Date() },
      end_date: { [Op.or]: [{ [Op.gte]: new Date() }, { [Op.is]: null }] },
    },
    include: [
      { model: User, as: 'customers', required: false },
    ],
  });

  const filtered = discounts.filter((discount) => {
    if (!discount.customers?.length) return true; // công khai
    return discount.customers.some((u) => u.id === userId);
  });

  res.status(200).json({
    success: true,
    data: filtered.map((d) => ({
      discount_code: d.discount_code,
      remaining_uses: d.usage_limit ? Math.max(d.usage_limit - d.usage_count, 0) : null,
      expires_in_days: d.end_date
        ? Math.ceil((new Date(d.end_date) - new Date()) / (1000 * 60 * 60 * 24))
        : null,
    })),
  });
};