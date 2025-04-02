import { Product, Variant, User, CustomPricing, QuantityBreak } from '../models/index.js';
import { Op } from 'sequelize';

export const calculatePrice = async (userId, productId, variantId = null, quantity = 1, transaction = null) => {
  let product, variant, originalPrice, finalPrice;
  let appliedRule = null;

  if (!quantity || quantity <= 0) quantity = 1;

  // Lấy giá gốc từ product hoặc variant
  if (variantId) {
    variant = await Variant.findByPk(variantId, { transaction });
    if (!variant) throw new Error('Variant not found');
    originalPrice = parseFloat(variant.original_price);
    finalPrice = parseFloat(variant.final_price);
  } else {
    product = await Product.findByPk(productId, { transaction });
    if (!product) throw new Error('Product not found');
    originalPrice = parseFloat(product.original_price);
    finalPrice = parseFloat(product.final_price);
  }

  // ===== ƯU TIÊN 1: Price List =====
  const priceListRules = await CustomPricing.findAll({
    where: {
      is_price_list: true,
      start_date: { [Op.lte]: new Date() },
      [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: new Date() } }],
    },
    include: [
      {
        model: User,
        as: 'customers',
        required: false,
        where: userId ? { id: userId } : undefined, // ✅ Cho phép rule dùng cho all users
      },
      {
        model: Product,
        as: 'products',
        where: productId ? { id: productId } : undefined,
        required: false,
        through: { attributes: ['amount'] },
      },
      {
        model: Variant,
        as: 'variants',
        where: variantId ? { id: variantId } : undefined,
        required: false,
        through: { attributes: ['amount'] },
      },
    ],
    transaction,
  });

  for (const rule of priceListRules) {
    const match = variantId
      ? rule.variants.find(v => v.id === variantId)
      : rule.products.find(p => p.id === productId);

    const priceFromAmount = variantId
      ? match?.CustomPricingVariant?.amount
      : match?.CustomPricingProduct?.amount;

    if (priceFromAmount !== undefined && priceFromAmount !== null) {
      finalPrice = parseFloat(priceFromAmount);
      appliedRule = rule;
      break;
    }
  }

  // ===== ƯU TIÊN 2: Quantity Break =====
  if (!appliedRule) {
    const qbRules = await QuantityBreak.findAll({
      where: {
        start_date: { [Op.lte]: new Date() },
        [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: new Date() } }],
      },
      include: [
        {
          model: User,
          as: 'customers',
          required: false,
          where: userId ? { id: userId } : undefined,
        },
        {
          model: Product,
          as: 'products',
          where: productId ? { id: productId } : undefined,
          required: false,
        },
        {
          model: Variant,
          as: 'variants',
          where: variantId ? { id: variantId } : undefined,
          required: false,
        },
      ],
      transaction,
    });

    for (const rule of qbRules) {
      const isMatched = variantId
        ? rule.variants.some(v => v.id === variantId)
        : rule.products.some(p => p.id === productId);
    
      if (!isMatched) continue;
    
      const matchedBreaks = rule.qb_rules
        .filter(r => quantity >= r.quantity)
        .sort((a, b) => b.quantity - a.quantity);
    

      if (matchedBreaks.length > 0) {
        const best = matchedBreaks[0];
        finalPrice =
          best.discount_type === 'percentage'
            ? originalPrice * (1 - best.value / 100)
            : Math.max(originalPrice - best.value, 0);
        appliedRule = rule;
        break;
      }
    }
  }

  // ===== ƯU TIÊN 3: Custom Pricing (percentage / fixed) =====
  if (!appliedRule && !variantId) {
    const cpRules = await CustomPricing.findAll({
      where: {
        is_price_list: false,
        start_date: { [Op.lte]: new Date() },
        [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: new Date() } }],
      },
      include: [
        {
          model: User,
          as: 'customers',
          required: false,
          where: userId ? { id: userId } : undefined,
        },
        {
          model: Product,
          as: 'products',
          where: productId ? { id: productId } : undefined,
          required: false,
        },
      ],
      transaction,
    });

    let maxDiscount = 0;

    for (const rule of cpRules) {
      const matched = rule.products.some(p => p.id === productId);
      if (!matched) continue;

      let discount = 0;
      if (rule.discount_type === 'percentage') {
        discount = (rule.discount_value / 100) * originalPrice;
      } else if (rule.discount_type === 'fixed price') {
        discount = rule.discount_value;
      }

      if (discount > maxDiscount) {
        maxDiscount = discount;
        finalPrice = Math.max(originalPrice - discount, 0);
        appliedRule = rule;
      }
    }
  }

  return {
    originalPrice,
    finalPrice,
    discountAmount: originalPrice - finalPrice,
    appliedRule,
  };
};