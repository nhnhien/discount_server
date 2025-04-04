import { Product, Variant, CustomPricing, QuantityBreak, User, Discount } from '../models/index.js';
import { Op } from 'sequelize';

export const calculatePrice = async (userId, productId, variantId = null, quantity = 1, options = {}) => {
  const applyQuantityBreak = options.applyQuantityBreak !== false;
  const effectiveUserId = userId || null;

  let originalPrice = 0;
  let finalPrice = 0;
  let appliedRule = null;
  let discountAmount = 0;

  const item = variantId
    ? await Variant.findByPk(variantId)
    : await Product.findByPk(productId);

  if (!item) {
    return { originalPrice: 0, finalPrice: 0, appliedRule: null, discountAmount: 0 };
  }

  originalPrice = Number(item.original_price) || 0;
  finalPrice = originalPrice;

  // Custom Pricing (bao gồm cả Price List)
  const cpRules = await CustomPricing.findAll({
    where: {
      start_date: { [Op.lte]: new Date() },
      end_date: { [Op.gte]: new Date() },
    },
    include: [
      { model: User, as: 'customers', required: false },
      { model: Product, as: 'products', through: { attributes: ['amount'] }, required: false },
      { model: Variant, as: 'variants', through: { attributes: ['amount'] }, required: false },
    ],
  });

  const filteredRules = cpRules.filter(rule => {
    if (rule.customers.length > 0) {
      return rule.customers.some(c => c.id === effectiveUserId);
    }
    return true;
  });

  for (const rule of filteredRules) {
    rule.amounts = [];

    rule.products?.forEach(p => {
      if (p.CustomPricingProduct?.amount != null) {
        rule.amounts.push({ product_id: p.id, amount: Number(p.CustomPricingProduct.amount) });
      }
    });

    rule.variants?.forEach(v => {
      if (v.CustomPricingVariant?.amount != null) {
        rule.amounts.push({ variant_id: v.id, amount: Number(v.CustomPricingVariant.amount) });
      }
    });
  }

  // Price List
  for (const rule of filteredRules.filter(r => r.is_price_list)) {
    const priceByAmount = rule.amounts.find(a =>
      variantId ? a.variant_id === variantId : a.product_id === productId
    );

    if (priceByAmount) {
      finalPrice = priceByAmount.amount;
      appliedRule = rule;
      discountAmount = originalPrice - finalPrice;
      break;
    }
  }

  // Quantity Break
  if (applyQuantityBreak && finalPrice === originalPrice) {
    const qbRules = await QuantityBreak.findAll({
      where: {
        start_date: { [Op.lte]: new Date() },
        end_date: { [Op.gte]: new Date() },
      },
      include: [
        { model: Product, as: 'products' },
        { model: Variant, as: 'variants' },
        { model: User, as: 'customers' },
      ],
    });

    const applicableQB = qbRules.find((rule) => {
      const isUserMatched = rule.customers?.some((u) => u.id === effectiveUserId);
      const isProductMatched = rule.products?.some((p) => p.id === productId);
      const isVariantMatched = rule.variants?.some((v) => v.id === variantId);
      return isUserMatched && (isVariantMatched || isProductMatched);
    });

    if (applicableQB) {
      const sortedTiers = [...applicableQB.qb_rules]
        .filter((tier) => quantity >= tier.quantity)
        .sort((a, b) => b.quantity - a.quantity);

      if (sortedTiers.length > 0) {
        const best = sortedTiers[0];
        let discount = 0;

        if (best.discount_type === 'percentage') {
          discount = (best.value / 100) * originalPrice;
        } else if (best.discount_type === 'fixed price') {
          discount = best.value;
        }

        finalPrice = Math.max(originalPrice - discount, 0);
        appliedRule = applicableQB;
        discountAmount = discount;
      }
    }
  }

  // Custom Pricing (dạng chiết khấu)
  if (!variantId && finalPrice === originalPrice) {
    const product = await Product.findByPk(productId);
    if (product?.has_variant) {
      // Không áp dụng chiết khấu lên product có variant
    } else {
      for (const rule of filteredRules.filter(r => !r.is_price_list)) {
        const matched = rule.products?.some(p => p.id === productId);
        if (!matched) continue;

        let discount = 0;
        if (rule.discount_type === 'percentage') {
          discount = (rule.discount_value / 100) * originalPrice;
        } else if (rule.discount_type === 'fixed price') {
          discount = rule.discount_value;
        }

        const discounted = Math.max(originalPrice - discount, 0);
        if (discounted < finalPrice) {
          finalPrice = discounted;
          appliedRule = rule;
          discountAmount = discount;
        }
      }
    }
  }

  // Discount Code
  if (options.appliedDiscountCode && finalPrice === originalPrice) {
    const discountCode = options.appliedDiscountCode.trim();
    const discount = await Discount.findOne({
      where: {
        discount_code: discountCode,
        is_active: true,
        start_date: { [Op.lte]: new Date() },
        end_date: { [Op.gte]: new Date() },
      },
      include: [
        { model: Product, as: 'products', required: false },
        { model: Variant, as: 'variants', required: false },
        { model: User, as: 'customers', required: false },
      ],
    });

    if (discount) {
      let isApplicable = true;
      
      // Kiểm tra sản phẩm
      if (
        discount.products?.length > 0 &&
        !discount.products.some(p => p.id === productId)
      ) isApplicable = false;
      
      // Kiểm tra biến thể
      if (
        discount.variants?.length > 0 &&
        variantId !== null &&
        !discount.variants.some(v => v.id === variantId)
      ) isApplicable = false;
      
      // Kiểm tra khách hàng
      if (
        discount.customers?.length > 0 &&
        !discount.customers.some(u => u.id === effectiveUserId)
      ) isApplicable = false;
      
      // Kiểm tra giá trị đơn hàng tối thiểu - CHỈ KIỂM TRA Ở MỨC ĐƠN HÀNG
      // (min_order_amount sẽ được kiểm tra ở cart.controller.js)

      if (isApplicable) {
        let totalDiscount = 0;

        if (discount.discount_type === 'percentage') {
          totalDiscount = (discount.value / 100) * originalPrice;
        } else if (discount.discount_type === 'fixed') {
          totalDiscount = discount.value / quantity; // Chia đều cho số lượng
        }

        discountAmount = totalDiscount;
        finalPrice = Math.max(originalPrice - totalDiscount, 0);
        appliedRule = discount;
      }
    }
  }

  // LƯU Ý: KHÔNG NHÂN VỚI QUANTITY Ở ĐÂY
  // Trả về đơn giá của một sản phẩm, để controller tự tính tổng
  return {
    originalPrice: originalPrice,
    finalPrice: finalPrice,
    appliedRule,
    discountAmount,
  };
};