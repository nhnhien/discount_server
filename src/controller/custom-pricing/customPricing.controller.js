import { CustomPricing, Market, Product, User, Variant } from '../../models/index.js';
import sequelize from '../../config/database.js';
import { Op } from 'sequelize';
import { validationResult } from 'express-validator';

const getCPRules = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, is_price_list } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause.title = { [Op.like]: `%${search}%` };
    }
    if (req.query.is_price_list !== undefined) {
      const parsed = String(req.query.is_price_list) === '1' || req.query.is_price_list === 'true';
      whereClause.is_price_list = parsed;
    }
    
    console.log('is_price_list:', req.query.is_price_list);
    console.log('Parsed boolean:', is_price_list === '1' ? true : false);
    const { rows: rules, count: total } = await CustomPricing.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Product,
          through: { attributes: ['amount'] }, // ✅ lấy amount
          as: 'products',
        },
        {
          model: Variant,
          through: { attributes: ['amount'] }, // ✅ lấy amount
          as: 'variants',
        },
        {
          model: Market,
          through: { attributes: [] },
          as: 'markets',
        },
        {
          model: User,
          through: { attributes: [] },
          as: 'customers',
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Custom pricing rules retrieved successfully',
      data: rules,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('getCPRules error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving custom pricing rules',
      error: error.message,
    });
  }
};

const getCPRule = async (req, res) => {
  try {
    const { id } = req.params;

    const rule = await CustomPricing.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'products',
          through: { attributes: ['amount'] }, // ✅ lấy giá tùy chỉnh từ bảng trung gian
        },
        {
          model: Variant,
          as: 'variants',
          through: { attributes: ['amount'] }, // ✅ lấy giá tùy chỉnh từ bảng trung gian
        },
        {
          model: Market,
          as: 'markets',
          through: { attributes: [] },
        },
        {
          model: User,
          as: 'customers',
          through: { attributes: [] },
        },
      ],
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Custom pricing rule not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Custom pricing rule retrieved successfully',
      data: rule,
    });
  } catch (error) {
    console.error('getCPRule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving custom pricing rule',
      error: error.message,
    });
  }
};



const createCPRule = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const {
    title,
    description,
    discount_type,
    discount_value,
    market_ids = [],
    customer_ids = [],
    variant_ids = [],
    product_ids = [],
    start_date,
    end_date,
    is_price_list = false,
    amounts = [],
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const rule = await CustomPricing.create(
      {
        title,
        description,
        discount_type: is_price_list ? null : discount_type,
        discount_value: is_price_list ? null : discount_value,
        start_date,
        end_date,
        is_price_list,
      },
      { transaction }
    );

    if (market_ids.length) await rule.setMarkets(market_ids, { transaction });
    if (customer_ids.length) await rule.setCustomers(customer_ids, { transaction });

    if (is_price_list) {
      for (const p of amounts.filter((x) => !x.variant_id)) {
        if (p.amount == null || isNaN(p.amount)) continue;
        await rule.addProduct(p.product_id, {
          through: { amount: p.amount },
          transaction,
        });
      }
      for (const v of amounts.filter((x) => !!x.variant_id)) {
        if (v.amount == null || isNaN(v.amount)) continue;
        await rule.addVariant(v.variant_id, {
          through: { amount: v.amount },
          transaction,
        });
      }
    } else {
      if (product_ids.length) await rule.setProducts(product_ids, { transaction });
      if (variant_ids.length) await rule.setVariants(variant_ids, { transaction });
    }

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'Custom pricing rule created successfully',
      data: rule,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in createCPRule:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating custom pricing rule',
      error: error.message,
    });
  }
};





const updateCPRule = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    discount_type,
    discount_value,
    market_ids = [],
    customer_ids = [],
    variant_ids = [],
    product_ids = [],
    start_date,
    end_date,
    is_price_list,
    amounts = [],
  } = req.body;

  const rule = await CustomPricing.findByPk(id);
  if (!rule) {
    return res.status(404).json({ success: false, message: 'Custom pricing rule not found' });
  }

  if (!is_price_list && (!discount_type || discount_value === undefined)) {
    return res.status(400).json({
      success: false,
      message: 'Missing discount_type or discount_value for Custom Pricing',
    });
  }

  const transaction = await sequelize.transaction();

  try {
    await rule.update(
      {
        title,
        description,
        discount_type: is_price_list ? null : discount_type,
        discount_value: is_price_list ? null : discount_value,
        start_date,
        end_date,
        is_price_list,
      },
      { transaction }
    );

    if (market_ids !== undefined) await rule.setMarkets(market_ids, { transaction });
    if (customer_ids !== undefined) await rule.setCustomers(customer_ids, { transaction });

    await rule.setVariants([], { transaction });
    await rule.setProducts([], { transaction });

    if (is_price_list) {
      for (const p of amounts.filter((x) => !x.variant_id)) {
        if (p.amount == null || isNaN(p.amount)) continue;
        await rule.addProduct(p.product_id, {
          through: { amount: p.amount },
          transaction,
        });
      }
      for (const v of amounts.filter((x) => !!x.variant_id)) {
        if (v.amount == null || isNaN(v.amount)) continue;
        await rule.addVariant(v.variant_id, {
          through: { amount: v.amount },
          transaction,
        });
      }
    } else {
      if (product_ids.length) await rule.setProducts(product_ids, { transaction });
      if (variant_ids.length) await rule.setVariants(variant_ids, { transaction });
    }

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Custom pricing rule updated successfully',
      data: rule,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      success: false,
      message: 'Error updating custom pricing rule',
      error: error.message,
    });
  }
};



const deleteCPRule = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCount = await CustomPricing.destroy({ where: { id } });

    if (!deletedCount) {
      return res.status(404).json({ success: false, message: 'Custom pricing rule not found' });
    }

    return res.status(200).json({ success: true, message: 'Custom pricing rule deleted successfully' });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Error deleting custom pricing rule', error: error.message });
  }
};

const applyCPRule = async (req, res) => {};

export { getCPRules, getCPRule, createCPRule, updateCPRule, deleteCPRule, applyCPRule };