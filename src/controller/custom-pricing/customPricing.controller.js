import { CustomPricing, Market, Product, User, Variant } from '../../models/index.js';
import sequelize from '../../config/database.js';
import { Op } from 'sequelize';
import { validationResult } from 'express-validator';

const getCPRules = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = search ? { name: { [Op.like]: `%${search}%` } } : {};

    const { rows: rules, count: total } = await CustomPricing.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Product,
          through: { attributes: [] },
          as: 'products',
        },
        {
          model: Variant,
          through: { attributes: [] },
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
          through: { attributes: [] },
          as: 'products',
        },
        {
          model: Variant,
          through: { attributes: [] },
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
    });

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Custom pricing rule not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Custom pricing rule retrieved successfully',
      data: rule,
    });
  } catch (error) {
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
  } = req.body;
  const transaction = await sequelize.transaction();

  try {
    const rule = await CustomPricing.create(
      { title, description, discount_type, discount_value, start_date, end_date },
      { transaction }
    );
    if (market_ids.length) await rule.setMarkets(market_ids, { transaction });
    if (customer_ids.length) await rule.setCustomers(customer_ids, { transaction });
    if (variant_ids.length) await rule.setVariants(variant_ids, { transaction });
    if (product_ids.length) await rule.setProducts(product_ids, { transaction });

    await transaction.commit();

    return res.status(201).json({ success: true, message: 'Custom pricing rule created successfully', data: rule });
  } catch (error) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ success: false, message: 'Error creating custom pricing rule', error: error.message });
  }
};

const updateCPRule = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    discount_type,
    discount_value,
    market_ids,
    customer_ids,
    variant_ids,
    product_ids,
    start_date,
    end_date,
  } = req.body;
  const rule = await CustomPricing.findByPk(id);
  if (!rule) return res.status(404).json({ success: false, message: 'Custom pricing rule not found' });

  const transaction = await sequelize.transaction();

  try {
    const updates = {};
    if (title !== undefined && title !== rule.title) updates.title = title;
    if (description !== undefined && description !== rule.description) updates.description = description;
    if (discount_type !== undefined && discount_type !== rule.discount_type) updates.discount_type = discount_type;
    if (discount_value !== undefined && discount_value !== rule.discount_value) updates.discount_value = discount_value;
    if (start_date !== undefined && start_date !== rule.start_date) updates.start_date = start_date;
    if (end_date !== undefined && end_date !== rule.end_date) updates.end_date = end_date;

    if (Object.keys(updates).length) {
      await rule.update(updates, { transaction });
    }
    if (market_ids !== undefined) await rule.setMarkets(market_ids, { transaction });
    if (customer_ids !== undefined) await rule.setCustomers(customer_ids, { transaction });
    if (variant_ids !== undefined) await rule.setVariants(variant_ids, { transaction });
    if (product_ids !== undefined) await rule.setProducts(product_ids, { transaction });

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
  /*************  ✨ Codeium Command ⭐  *************/
  /**
 * Deletes a custom pricing rule by its ID.
 * 
/******  0630b964-0af5-4d4d-b37c-827d7ca3d715  *******/
};

const applyCPRule = async (req, res) => {};

export { getCPRules, getCPRule, createCPRule, updateCPRule, deleteCPRule, applyCPRule };
