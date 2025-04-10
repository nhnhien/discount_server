import { Cart, CartItem, Product, Variant, Address, Discount, ShippingFee, User } from '../models/index.js';
import { Op } from 'sequelize';
import { calculatePrice } from './calculatePrice.js';

export const getCartSummary = async (userId, selectedItemIds = null, applyDiscount = false) => {
  const cart = await Cart.findOne({
    where: { user_id: userId, status: 'active' },
  });

  const cartItems = await CartItem.findAll({
    where: { cart_id: cart.id },
    include: [
      { model: Product, as: 'product' },
      { model: Variant, as: 'variant' },
    ],
  });

  const formattedItems = await Promise.all(
    cartItems.map(async (item) => {
      const quantity = item.quantity;
      const priceData = await calculatePrice(userId, item.product_id, item.variant_id, quantity);
      const totalPrice = priceData.finalPrice * quantity;

      return {
        id: item.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity,
        unit_price: priceData.finalPrice,
        total_price: totalPrice,
        discount_amount: priceData.discountAmount * quantity,
      };
    })
  );

  const selectedItems = selectedItemIds?.length
    ? formattedItems.filter((item) => selectedItemIds.includes(item.id))
    : formattedItems;

  const subtotal = selectedItems.reduce((sum, item) => sum + item.total_price, 0);

  let shippingFeeAmount = 0;
  const FREE_SHIPPING_THRESHOLD = 500000;

  let shippingAddress = null;
  if (cart.shipping_address_id) {
    shippingAddress = await Address.findByPk(cart.shipping_address_id);
  }

  if (shippingAddress?.city) {
    const shippingFeeRecord = await ShippingFee.findOne({
      where: { region: shippingAddress.city, is_active: true },
    });

    shippingFeeAmount = shippingFeeRecord ? Number(shippingFeeRecord.fee) : 10000;
    if (subtotal >= FREE_SHIPPING_THRESHOLD) shippingFeeAmount = 0;
  }

  let discountAmount = 0;

  if (applyDiscount && cart.discount_code) {
    const discount = await Discount.findOne({
      where: {
        discount_code: cart.discount_code,
        is_active: true,
        start_date: { [Op.lte]: new Date() },
        end_date: { [Op.or]: [{ [Op.gte]: new Date() }, { [Op.is]: null }] },
      },
      include: [
        { model: Product, as: 'products', required: false },
        { model: Variant, as: 'variants', required: false },
        { model: User, as: 'customers', required: false },
      ],
    });

    if (discount) {
      const productIds = selectedItems.map((item) => item.product_id);
      const variantIds = selectedItems.map((item) => item.variant_id).filter(Boolean);

      let isApplicable = true;

      if (discount.products?.length > 0) {
        const hasProductMatch = discount.products.some((p) => productIds.includes(p.id));
        if (!hasProductMatch) isApplicable = false;
      }

      if (discount.variants?.length > 0) {
        const hasVariantMatch = discount.variants.some((v) => variantIds.includes(v.id));
        if (!hasVariantMatch) isApplicable = false;
      }

      if (discount.customers?.length > 0) {
        const isCustomerAllowed = discount.customers.some((u) => u.id === userId);
        if (!isCustomerAllowed) isApplicable = false;
      }

      if (isApplicable) {
        if (discount.discount_type === 'percentage') {
          discountAmount = (subtotal * Number(discount.value)) / 100;
        } else if (discount.discount_type === 'fixed') {
          discountAmount = Number(discount.value);
        } else if (discount.discount_type === 'free_shipping') {
          discountAmount = shippingFeeAmount;
          shippingFeeAmount = 0;
        }

        const maxDiscountAmount = Number(discount.max_discount_amount);
        if (!isNaN(maxDiscountAmount) && discountAmount > maxDiscountAmount) {
          discountAmount = maxDiscountAmount;
        }

        if (!isNaN(discount.min_order_amount) && subtotal < discount.min_order_amount) {
          discountAmount = 0;
        }
      }
    }
  }

  const totalAmount = Math.max(subtotal + shippingFeeAmount - discountAmount, 0);

  return {
    subtotal,
    shipping_fee: shippingFeeAmount,
    discount_amount: discountAmount,
    total_amount: totalAmount,
    shipping_address: shippingAddress,
  };
};
