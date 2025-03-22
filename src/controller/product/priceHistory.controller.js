import { PriceHistory, Product, Variant, User } from '../../models/index.js';

const getProductPriceHistory = async (req, res) => {
  try {
    const { product_id } = req.params;
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại',
      });
    }

    const priceHistory = await PriceHistory.findAll({
      where: {
        product_id,
        variant_id: null,
      },
      order: [['changed_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          current_original_price: product.original_price,
          current_final_price: product.final_price,
        },
        price_history: priceHistory,
      },
    });
  } catch (error) {
    console.error('Error in getProductPriceHistory:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy lịch sử giá sản phẩm',
      error: error.message,
    });
  }
};

const getVariantPriceHistory = async (req, res) => {
  try {
    const { variant_id } = req.params;
    const variant = await Variant.findByPk(variant_id, {
      include: [{ model: Product, as: 'product' }],
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Biến thể sản phẩm không tồn tại',
      });
    }

    const priceHistory = await PriceHistory.findAll({
      where: { variant_id },
      order: [['changed_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: {
        variant: {
          id: variant.id,
          sku: variant.sku,
          product_name: variant.product.name,
          current_original_price: variant.original_price,
          current_final_price: variant.final_price,
        },
        price_history: priceHistory,
      },
    });
  } catch (error) {
    console.error('Error in getVariantPriceHistory:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy lịch sử giá biến thể sản phẩm',
      error: error.message,
    });
  }
};

const getAllPriceHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, from_date, to_date, price_type } = req.query;
    const whereCondition = {};
    if (from_date || to_date) {
      whereCondition.changed_at = {};
      if (from_date) whereCondition.changed_at[Op.gte] = new Date(from_date);
      if (to_date) whereCondition.changed_at[Op.lte] = new Date(to_date);
    }
    if (price_type && ['original', 'final'].includes(price_type)) {
      whereCondition.price_type = price_type;
    }

    const offset = (page - 1) * limit;
    const { count, rows: priceHistory } = await PriceHistory.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['changed_at', 'DESC']],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name'],
        },
        {
          model: Variant,
          as: 'variant',
          attributes: ['id', 'sku'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: {
        total_items: count,
        total_pages: Math.ceil(count / limit),
        current_page: parseInt(page),
        items_per_page: parseInt(limit),
        items: priceHistory,
      },
    });
  } catch (error) {
    console.error('Error in getAllPriceHistory:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy lịch sử giá',
      error: error.message,
    });
  }
};

export { getProductPriceHistory, getAllPriceHistory, getVariantPriceHistory };
