// controllers/quantityBreakController.js
import { QuantityBreak, Product, Variant, User, Market, CustomPricing, sequelize } from '../../models/index.js';
import { Op } from 'sequelize';

export const getQuantityBreaks = async (req, res) => {
  try {
    const { product_id, variant_id, customer_id, market_id } = req.query;

    const includeOptions = [
      {
        model: Product,
        as: 'products',
        where: product_id ? { id: product_id } : undefined,
        required: !!product_id,
      },
      {
        model: Variant,
        as: 'variants',
        where: variant_id ? { id: variant_id } : undefined,
        required: !!variant_id,
      },
      {
        model: User,
        as: 'customers',
        where: customer_id ? { id: customer_id } : undefined,
        required: !!customer_id,
      },
      {
        model: Market,
        as: 'markets',
        where: market_id ? { id: market_id } : undefined,
        required: !!market_id,
      },
    ];

    const quantityBreaks = await QuantityBreak.findAll({
      where: whereCondition,
      include: includeOptions,
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: quantityBreaks,
    });
  } catch (error) {
    console.error('Error in getQuantityBreaks:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách QuantityBreak',
      error: error.message,
    });
  }
};

export const getQuantityBreakById = async (req, res) => {
  try {
    const { id } = req.params;

    const quantityBreak = await QuantityBreak.findByPk(id, {
      include: [
        { model: Product, as: 'products' },
        { model: Variant, as: 'variants' },
        { model: User, as: 'customers' },
        { model: Market, as: 'markets' },
      ],
    });

    if (!quantityBreak) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy QuantityBreak',
      });
    }

    return res.status(200).json({
      success: true,
      data: quantityBreak,
    });
  } catch (error) {
    console.error('Error in getQuantityBreakById:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin QuantityBreak',
      error: error.message,
    });
  }
};

export const createQuantityBreak = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { title, description, qb_rules, start_date, end_date, product_ids, variant_ids, customer_ids, market_ids } =
      req.body;
    if (!title || !qb_rules || !Array.isArray(qb_rules) || qb_rules.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết: title và qb_rules là bắt buộc',
      });
    }
    for (const rule of qb_rules) {
      if (!rule.quantity || typeof rule.quantity !== 'number' || rule.quantity <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Mỗi quy tắc phải có số lượng (quantity) hợp lệ > 0',
        });
      }

      if (!rule.discount_type || !['percentage', 'fixed'].includes(rule.discount_type)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Mỗi quy tắc phải có loại giảm giá (discount_type) là "percentage" hoặc "fixed"',
        });
      }

      if (rule.value === undefined || typeof rule.value !== 'number' || rule.value < 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Mỗi quy tắc phải có giá trị giảm giá (value) >= 0',
        });
      }
    }
    const sortedRules = [...qb_rules].sort((a, b) => a.quantity - b.quantity);
    const quantityBreak = await QuantityBreak.create(
      {
        title,
        description,
        qb_rules: sortedRules,
        start_date: start_date || new Date(),
        end_date: end_date || null,
      },
      { transaction }
    );
    if (product_ids && product_ids.length > 0) {
      const products = await Product.findAll({
        where: { id: product_ids },
        transaction,
      });
      await quantityBreak.setProducts(products, { transaction });
    } else if (!variant_ids || variant_ids.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Phải có ít nhất một sản phẩm hoặc biến thể để áp dụng',
      });
    }
    if (variant_ids && variant_ids.length > 0) {
      const variants = await Variant.findAll({
        where: { id: variant_ids },
        transaction,
      });
      await quantityBreak.setVariants(variants, { transaction });
    }

    if (customer_ids && customer_ids.length > 0) {
      const customers = await User.findAll({
        where: { id: customer_ids },
        transaction,
      });
      await quantityBreak.setCustomers(customers, { transaction });
    }
    if (market_ids && market_ids.length > 0) {
      const markets = await Market.findAll({
        where: { id: market_ids },
        transaction,
      });
      await quantityBreak.setMarkets(markets, { transaction });
    }

    await transaction.commit();

    const result = await QuantityBreak.findByPk(quantityBreak.id, {
      include: [
        { model: Product, as: 'products' },
        { model: Variant, as: 'variants' },
        { model: User, as: 'customers' },
        { model: Market, as: 'markets' },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Đã tạo thành công QuantityBreak',
      data: result,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in createQuantityBreak:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tạo QuantityBreak',
      error: error.message,
    });
  }
};

export const updateQuantityBreak = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { title, description, qb_rules, start_date, end_date, product_ids, variant_ids, customer_ids, market_ids } =
      req.body;
    const quantityBreak = await QuantityBreak.findByPk(id, { transaction });
    if (!quantityBreak) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy QuantityBreak',
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;

    if (qb_rules !== undefined) {
      if (!Array.isArray(qb_rules) || qb_rules.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'qb_rules phải là mảng không rỗng',
        });
      }
      for (const rule of qb_rules) {
        if (!rule.quantity || typeof rule.quantity !== 'number' || rule.quantity <= 0) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Mỗi quy tắc phải có số lượng (quantity) hợp lệ > 0',
          });
        }

        if (!rule.discount_type || !['percentage', 'fixed'].includes(rule.discount_type)) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Mỗi quy tắc phải có loại giảm giá (discount_type) là "percentage" hoặc "fixed"',
          });
        }

        if (rule.value === undefined || typeof rule.value !== 'number' || rule.value < 0) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Mỗi quy tắc phải có giá trị giảm giá (value) >= 0',
          });
        }
      }

      updateData.qb_rules = [...qb_rules].sort((a, b) => a.quantity - b.quantity);
    }

    await quantityBreak.update(updateData, { transaction });

    if (product_ids !== undefined) {
      if (product_ids.length > 0) {
        const products = await Product.findAll({
          where: { id: product_ids },
          transaction,
        });
        await quantityBreak.setProducts(products, { transaction });
      } else {
        await quantityBreak.setProducts([], { transaction });
      }
    }

    if (variant_ids !== undefined) {
      if (variant_ids.length > 0) {
        const variants = await Variant.findAll({
          where: { id: variant_ids },
          transaction,
        });
        await quantityBreak.setVariants(variants, { transaction });
      } else {
        await quantityBreak.setVariants([], { transaction });
      }
    }

    if (customer_ids !== undefined) {
      if (customer_ids.length > 0) {
        const customers = await User.findAll({
          where: { id: customer_ids },
          transaction,
        });
        await quantityBreak.setCustomers(customers, { transaction });
      } else {
        await quantityBreak.setCustomers([], { transaction });
      }
    }

    if (market_ids !== undefined) {
      if (market_ids.length > 0) {
        const markets = await Market.findAll({
          where: { id: market_ids },
          transaction,
        });
        await quantityBreak.setMarkets(markets, { transaction });
      } else {
        await quantityBreak.setMarkets([], { transaction });
      }
    }

    await transaction.commit();

    const result = await QuantityBreak.findByPk(id, {
      include: [
        { model: Product, as: 'products' },
        { model: Variant, as: 'variants' },
        { model: User, as: 'customers' },
        { model: Market, as: 'markets' },
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'Đã cập nhật thành công QuantityBreak',
      data: result,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in updateQuantityBreak:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật QuantityBreak',
      error: error.message,
    });
  }
};

export const deleteQuantityBreak = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const quantityBreak = await QuantityBreak.findByPk(id, { transaction });
    if (!quantityBreak) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy QuantityBreak',
      });
    }
    await quantityBreak.destroy({ transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Đã xóa thành công QuantityBreak',
      data: { id },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in deleteQuantityBreak:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể xóa QuantityBreak',
      error: error.message,
    });
  }
};

export const calculatePrice = async (req, res) => {
  try {
    const { product_id, variant_id, quantity, user_id, market_id } = req.body;

    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết hoặc số lượng không hợp lệ',
      });
    }
    let product, variant, basePrice;

    if (variant_id) {
      variant = await Variant.findOne({
        where: { id: variant_id, product_id },
        include: [{ model: Product, as: 'product' }],
      });

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy biến thể',
        });
      }

      product = variant.product;
      basePrice = variant.final_price || variant.original_price;
    } else {
      product = await Product.findByPk(product_id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy sản phẩm',
        });
      }

      basePrice = product.final_price || product.original_price;
    }

    const result = {
      product_id,
      variant_id: variant_id || null,
      quantity,
      original_price: basePrice,
      final_price: basePrice,
      discount_amount: 0,
      custom_pricing: null,
      quantity_break: null,
    };

    if (user_id) {
      const customPricingRules = await CustomPricing.findAll({
        where: {
          start_date: { [Op.lte]: new Date() },
          [Op.or]: [{ end_date: { [Op.gte]: new Date() } }, { end_date: null }],
        },
        include: [
          {
            model: User,
            as: 'customers',
            where: { id: user_id },
            required: false,
          },
          {
            model: Product,
            as: 'products',
            where: { id: product_id },
            required: false,
          },
          {
            model: Variant,
            as: 'variants',
            where: variant_id ? { id: variant_id } : { id: null },
            required: false,
          },
          {
            model: Market,
            as: 'markets',
            where: market_id ? { id: market_id } : { id: null },
            required: false,
          },
        ],
      });

      let maxDiscount = 0;
      let bestCPRule = null;

      customPricingRules.forEach((rule) => {
        let isApplicable = false;
        if (rule.products && rule.products.some((p) => p.id === product_id)) {
          isApplicable = true;
        }
        if (variant_id && rule.variants && rule.variants.some((v) => v.id === variant_id)) {
          isApplicable = true;
        }
        const hasCustomerMatch = !rule.customers.length || rule.customers.some((c) => c.id === parseInt(user_id));
        const hasMarketMatch =
          !rule.markets.length || !market_id || rule.markets.some((m) => m.id === parseInt(market_id));

        if (isApplicable && hasCustomerMatch && hasMarketMatch) {
          let discount = 0;

          if (rule.discount_type === 'percentage') {
            discount = (rule.discount_value / 100) * basePrice;
          } else if (rule.discount_type === 'fixed') {
            discount = rule.discount_value;
          }

          if (discount > maxDiscount) {
            maxDiscount = discount;
            bestCPRule = rule;
          }
        }
      });

      if (bestCPRule) {
        result.final_price = Math.max(basePrice - maxDiscount, 0);
        result.discount_amount = maxDiscount;
        result.custom_pricing = {
          id: bestCPRule.id,
          title: bestCPRule.title,
          discount_type: bestCPRule.discount_type,
          discount_value: bestCPRule.discount_value,
        };
      }
    }

    const quantityBreaks = await QuantityBreak.findAll({
      where: {
        start_date: { [Op.lte]: new Date() },
        [Op.or]: [{ end_date: { [Op.gte]: new Date() } }, { end_date: null }],
      },
      include: [
        {
          model: Product,
          as: 'products',
          where: { id: product_id },
          required: false,
        },
        {
          model: Variant,
          as: 'variants',
          where: variant_id ? { id: variant_id } : { id: null },
          required: false,
        },
        {
          model: User,
          as: 'customers',
          where: user_id ? { id: user_id } : { id: null },
          required: false,
        },
        {
          model: Market,
          as: 'markets',
          where: market_id ? { id: market_id } : { id: null },
          required: false,
        },
      ],
    });

    let bestQBRule = null;
    let bestQB = null;
    let maxQBDiscount = 0;

    quantityBreaks.forEach((qb) => {
      let isApplicable = false;
      if (qb.products && qb.products.some((p) => p.id === product_id)) {
        isApplicable = true;
      }

      if (variant_id && qb.variants && qb.variants.some((v) => v.id === variant_id)) {
        isApplicable = true;
      }

      const hasCustomerMatch = !qb.customers.length || !user_id || qb.customers.some((c) => c.id === parseInt(user_id));

      const hasMarketMatch = !qb.markets.length || !market_id || qb.markets.some((m) => m.id === parseInt(market_id));

      if (isApplicable && hasCustomerMatch && hasMarketMatch) {
        const qbRules = qb.qb_rules || [];

        const sortedRules = [...qbRules].sort((a, b) => b.quantity - a.quantity);

        const applicableRule = sortedRules.find((rule) => quantity >= rule.quantity);

        if (applicableRule) {
          let discount = 0;

          if (applicableRule.discount_type === 'percentage') {
            discount = (applicableRule.value / 100) * result.final_price;
          } else if (applicableRule.discount_type === 'fixed') {
            discount = applicableRule.value;
          }

          if (discount > maxQBDiscount) {
            maxQBDiscount = discount;
            bestQBRule = applicableRule;
            bestQB = qb;
          }
        }
      }
    });

    if (bestQBRule) {
      const priceAfterQB = Math.max(result.final_price - maxQBDiscount, 0);
      result.discount_amount += maxQBDiscount;
      result.final_price = priceAfterQB;
      result.quantity_break = {
        id: bestQB.id,
        title: bestQB.title,
        rule: {
          quantity: bestQBRule.quantity,
          discount_type: bestQBRule.discount_type,
          value: bestQBRule.value,
        },
      };
    }

    result.total_price = result.final_price * quantity;
    result.total_discount = result.discount_amount * quantity;

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in calculatePrice:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tính giá sản phẩm',
      error: error.message,
    });
  }
};

export const getQuantityBreaksByProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { user_id, market_id, active_only } = req.query;

    const whereCondition = {};

    // Nếu active_only=true, chỉ lấy các quy tắc còn hiệu lực
    if (active_only === 'true') {
      whereCondition.start_date = { [Op.lte]: new Date() };
      whereCondition[Op.or] = [{ end_date: { [Op.gte]: new Date() } }, { end_date: null }];
    }

    const includeOptions = [
      {
        model: Product,
        as: 'products',
        where: { id: product_id },
        required: true,
      },
      {
        model: User,
        as: 'customers',
        where: user_id ? { id: user_id } : undefined,
        required: !!user_id,
      },
      {
        model: Market,
        as: 'markets',
        where: market_id ? { id: market_id } : undefined,
        required: !!market_id,
      },
    ];

    const quantityBreaks = await QuantityBreak.findAll({
      where: whereCondition,
      include: includeOptions,
    });

    return res.status(200).json({
      success: true,
      data: quantityBreaks,
    });
  } catch (error) {
    console.error('Error in getQuantityBreaksByProduct:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách QuantityBreak theo sản phẩm',
      error: error.message,
    });
  }
};

export const getQuantityBreaksByVariant = async (req, res) => {
  try {
    const { variant_id } = req.params;
    const { user_id, market_id, active_only } = req.query;

    const whereCondition = {};

    if (active_only === 'true') {
      whereCondition.start_date = { [Op.lte]: new Date() };
      whereCondition[Op.or] = [{ end_date: { [Op.gte]: new Date() } }, { end_date: null }];
    }

    const includeOptions = [
      {
        model: Variant,
        as: 'variants',
        where: { id: variant_id },
        required: true,
      },
      {
        model: User,
        as: 'customers',
        where: user_id ? { id: user_id } : undefined,
        required: !!user_id,
      },
      {
        model: Market,
        as: 'markets',
        where: market_id ? { id: market_id } : undefined,
        required: !!market_id,
      },
    ];

    const quantityBreaks = await QuantityBreak.findAll({
      where: whereCondition,
      include: includeOptions,
    });

    return res.status(200).json({
      success: true,
      data: quantityBreaks,
    });
  } catch (error) {
    console.error('Error in getQuantityBreaksByVariant:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách QuantityBreak theo biến thể',
      error: error.message,
    });
  }
};

export default {
  getQuantityBreaks,
  getQuantityBreakById,
  createQuantityBreak,
  updateQuantityBreak,
  deleteQuantityBreak,
  calculatePrice,
  getQuantityBreaksByProduct,
  getQuantityBreaksByVariant,
};
