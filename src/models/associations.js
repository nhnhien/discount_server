import Category from './category.js';
import Market from './market.js';
import Product from './product.js';
import Role from './role.js';
import User from './user.js';
import Attribute from './attribute.js';
import AttributeValue from './attribute_value.js';
import VariantValue from './variant_value.js';
import Variant from './variant.js';
import Discount from './discount.js';
import CustomPricing from './custom_pricing.js';
import CustomPricingMarket from './cp_market.js';
import CustomPricingCustomer from './cp_customer.js';
import CustomPricingProduct from './cp_product.js';
import CustomPricingVariant from './cp_variant.js';
import CartItem from './cart_item.js';
import Cart from './cart.js';
import Address from './address.js';
import PriceHistory from './price_history.js';
import QuantityBreak from './quantity_break.js';
import QBCustomer from './qb_customer.js';
import QBMarket from './qb_market.js';
import QBProduct from './qb_product.js';
import QBVariant from './qb_variant.js';
import DiscountCustomer from './discount-customer.js';
import DiscountVariant from './discount-variant.js';
import DiscountProduct from './discount-product.js';
import Order from './order.js';
import OrderItem from './order_item.js';
import Delivery from './delivery.js';

const setUpAssociations = () => {
  // Role - User (1-M)
  Role.hasMany(User, { foreignKey: 'role_id', onDelete: 'CASCADE' });
  User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' }); // 👈 thêm `as: 'role'`

  // Market - Product (1-M)
  Market.hasMany(Product, { foreignKey: 'market_id', onDelete: 'CASCADE' });
  Product.belongsTo(Market, { foreignKey: 'market_id' });

  // Category - Product (1-M)
  Category.hasMany(Product, { foreignKey: 'category_id', as: 'products', onDelete: 'CASCADE' });
  Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

  // Product - Variant (1-M)
  Product.hasMany(Variant, { foreignKey: 'product_id', as: 'variants', onDelete: 'CASCADE' });
  Variant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // // Product - Image (1-M)
  // Product.hasMany(Image, { foreignKey: 'product_id', as: 'product_image', onDelete: 'CASCADE' });
  // Image.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // // Variant - Image (1-M)
  // Variant.hasMany(Image, { foreignKey: 'variant_id', as: 'varian_image', onDelete: 'CASCADE' });
  // Image.belongsTo(Variant, { foreignKey: 'variant_id', as: 'variant' });

  // Attribute - AttributeValue (1-M)
  Attribute.hasMany(AttributeValue, { foreignKey: 'attribute_id', as: 'attribute_value', onDelete: 'CASCADE' });
  AttributeValue.belongsTo(Attribute, { foreignKey: 'attribute_id', as: 'attribute' });

  // Variant - VariantValue (1-M)
  Variant.hasMany(VariantValue, { foreignKey: 'variant_id', as: 'variant_value', onDelete: 'CASCADE' });
  VariantValue.belongsTo(Variant, { foreignKey: 'variant_id', as: 'variant' });

  // AttributeValue - VariantValue (1-M)
  AttributeValue.hasMany(VariantValue, { foreignKey: 'attribute_value_id', as: 'variant_value', onDelete: 'CASCADE' });
  VariantValue.belongsTo(AttributeValue, { foreignKey: 'attribute_value_id', as: 'attribute_value' });
  //CustomPricing - Market (M-M)
  CustomPricing.belongsToMany(Market, {
    through: CustomPricingMarket,
    foreignKey: 'cp_id',
    onDelete: 'CASCADE',
    as: 'markets',
  });
  Market.belongsToMany(CustomPricing, {
    through: CustomPricingMarket,
    foreignKey: 'market_id',
    onDelete: 'CASCADE',
    as: 'cpRules',
  });

  //CustomPricing - Customer (M-M)
  CustomPricing.belongsToMany(User, {
    through: CustomPricingCustomer,
    foreignKey: 'cp_id',
    onDelete: 'CASCADE',
    as: 'customers',
  });
  User.belongsToMany(CustomPricing, {
    through: CustomPricingCustomer,
    foreignKey: 'customer_id',
    onDelete: 'CASCADE',
    as: 'cpRules',
  });

  //CustomPricing - Product (M-M)
  CustomPricing.belongsToMany(Product, {
    through: CustomPricingProduct,
    foreignKey: 'cp_id',
    otherKey: 'product_id',
    as: 'products',
  });

  Product.belongsToMany(CustomPricing, {
    through: CustomPricingProduct,
    foreignKey: 'product_id',
    otherKey: 'cp_id',
    as: 'cpRules',
  });

  //CustomPricing - Variant (M-M)
  CustomPricing.belongsToMany(Variant, {
    through: CustomPricingVariant,
    foreignKey: 'cp_id',
    otherKey: 'variant_id',
    as: 'variants',
  });
  Variant.belongsToMany(CustomPricing, {
    through: CustomPricingVariant,
    foreignKey: 'variant_id',
    otherKey: 'cp_id',
    as: 'cpRules',
  });
  // User - Address (1-M)
  User.hasMany(Address, {
    foreignKey: 'user_id',
    as: 'addresses',
    onDelete: 'CASCADE',
  });
  Address.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
  });

  // User - Cart (1-M)
  User.hasMany(Cart, {
    foreignKey: 'user_id',
    as: 'carts',
    onDelete: 'CASCADE',
  });
  Cart.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
  });

  // Cart - CartItem (1-M)
  Cart.hasMany(CartItem, {
    foreignKey: 'cart_id',
    as: 'items',
    onDelete: 'CASCADE',
  });
  CartItem.belongsTo(Cart, {
    foreignKey: 'cart_id',
    as: 'cart',
  });

  // Address - Cart (1-M)
  Address.hasMany(Cart, {
    foreignKey: 'shipping_address_id',
    as: 'carts_shipping',
    onDelete: 'SET NULL',
  });
  Cart.belongsTo(Address, {
    foreignKey: 'shipping_address_id',
    as: 'shipping_address',
  });

  // Product - CartItem (1-M)
  Product.hasMany(CartItem, {
    foreignKey: 'product_id',
    as: 'cart_items',
    onDelete: 'CASCADE',
  });
  CartItem.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product',
  });

  // Variant - CartItem (1-M)
  Variant.hasMany(CartItem, {
    foreignKey: 'variant_id',
    as: 'cart_items',
    onDelete: 'CASCADE',
  });
  CartItem.belongsTo(Variant, {
    foreignKey: 'variant_id',
    as: 'variant',
  });
  // Product- PriceHistory
  Product.hasMany(PriceHistory, {
    foreignKey: 'product_id',
    as: 'price_history',
    onDelete: 'CASCADE',
  });
  PriceHistory.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product',
  });

  // Variant - PriceHistory (1-M)
  Variant.hasMany(PriceHistory, {
    foreignKey: 'variant_id',
    as: 'price_history',
    onDelete: 'CASCADE',
  });
  PriceHistory.belongsTo(Variant, {
    foreignKey: 'variant_id',
    as: 'variant',
  });
  // User - PriceHistory (1-M)
  User.hasMany(PriceHistory, {
    foreignKey: 'changed_by',
    as: 'price_changes',
    onDelete: 'SET NULL',
  });
  PriceHistory.belongsTo(User, {
    foreignKey: 'changed_by',
    as: 'user',
  });

  // QuantityBreak - User (M-M)
  QuantityBreak.belongsToMany(User, {
    through: QBCustomer,
    foreignKey: 'quantity_break_id',
    otherKey: 'customer_id',
    as: 'customers',
    onDelete: 'CASCADE',
  });

  User.belongsToMany(QuantityBreak, {
    through: QBCustomer,
    foreignKey: 'customer_id',
    otherKey: 'quantity_break_id',
    as: 'quantity_breaks',
    onDelete: 'CASCADE',
  });

  // QuantityBreak - Market (M-M)
  QuantityBreak.belongsToMany(Market, {
    through: QBMarket,
    foreignKey: 'quantity_break_id',
    otherKey: 'market_id',
    as: 'markets',
    onDelete: 'CASCADE',
  });

  Market.belongsToMany(QuantityBreak, {
    through: QBMarket,
    foreignKey: 'market_id',
    otherKey: 'quantity_break_id',
    as: 'quantity_breaks',
    onDelete: 'CASCADE',
  });

  // QuantityBreak - Product (M-M)
  QuantityBreak.belongsToMany(Product, {
    through: QBProduct,
    foreignKey: 'quantity_break_id',
    otherKey: 'product_id',
    as: 'products',
    onDelete: 'CASCADE',
  });

  Product.belongsToMany(QuantityBreak, {
    through: QBProduct,
    foreignKey: 'product_id',
    otherKey: 'quantity_break_id',
    as: 'quantity_breaks',
    onDelete: 'CASCADE',
  });

  // QuantityBreak - Variant (M-M)
  QuantityBreak.belongsToMany(Variant, {
    through: QBVariant,
    foreignKey: 'quantity_break_id',
    otherKey: 'variant_id',
    as: 'variants',
    onDelete: 'CASCADE',
  });

  Variant.belongsToMany(QuantityBreak, {
    through: QBVariant,
    foreignKey: 'variant_id',
    otherKey: 'quantity_break_id',
    as: 'quantity_breaks',
    onDelete: 'CASCADE',
  });
  //Discount-Product
  Discount.belongsToMany(Product, {
    through: DiscountProduct,
    foreignKey: 'discount_id',
    otherKey: 'product_id',
    as: 'products',
  });

  Product.belongsToMany(Discount, {
    through: DiscountProduct,
    foreignKey: 'product_id',
    otherKey: 'discount_id',
    as: 'discounts',
  });
  //Discount-Variant
  Discount.belongsToMany(Variant, {
    through: DiscountVariant,
    foreignKey: 'discount_id',
    otherKey: 'variant_id',
    as: 'variants',
  });

  Variant.belongsToMany(Discount, {
    through: DiscountVariant,
    foreignKey: 'variant_id',
    otherKey: 'discount_id',
    as: 'discounts',
  });
  //Discount-User

  Discount.belongsToMany(User, {
    through: DiscountCustomer,
    foreignKey: 'discount_id',
    otherKey: 'user_id',
    as: 'customers',
  });

  User.belongsToMany(Discount, {
    through: DiscountCustomer,
    foreignKey: 'user_id',
    otherKey: 'discount_id',
    as: 'discounts',
  });

  User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
  Order.belongsTo(User, { foreignKey: 'user_id', as: 'customer' });

  // Order - Address (Billing)
  Order.belongsTo(Address, { foreignKey: 'billing_address_id', as: 'billingAddress' });
  Address.hasMany(Order, { foreignKey: 'billing_address_id', as: 'billingOrders' });

  // Order - Address (Shipping)
  Order.belongsTo(Address, { foreignKey: 'shipping_address_id', as: 'shippingAddress' });
  Address.hasMany(Order, { foreignKey: 'shipping_address_id', as: 'shippingOrders' });

  // Order - Discount
  Order.belongsTo(Discount, { foreignKey: 'discount_id' });
  Discount.hasMany(Order, { foreignKey: 'discount_id', as: 'orders' });

  // Order - OrderItem (1-M)
  Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
  OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

  // OrderItem - Product (M-1)
  Product.hasMany(OrderItem, { foreignKey: 'product_id' });
  OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

  // OrderItem - Variant (M-1)
  Variant.hasMany(OrderItem, { foreignKey: 'variant_id' });
  OrderItem.belongsTo(Variant, { foreignKey: 'variant_id' });

  // Order - Delivery (1-1)
  Order.hasOne(Delivery, { foreignKey: 'order_id', as: 'delivery', onDelete: 'CASCADE' });
  Delivery.belongsTo(Order, { foreignKey: 'order_id' });

  // Delivery - User (updated_by)
  Delivery.belongsTo(User, { foreignKey: 'updated_by', as: 'updatedByUser' });
  User.hasMany(Delivery, { foreignKey: 'updated_by', as: 'updatedDeliveries' });

  // Order - User (updated_by)
  Order.belongsTo(User, { foreignKey: 'updated_by', as: 'updatedByUser' });
  User.hasMany(Order, { foreignKey: 'updated_by', as: 'updatedOrders' });
};

// Gắn alias riêng biệt cho mỗi bảng phụ
CustomPricing.hasMany(CustomPricingProduct, { foreignKey: 'cp_id', as: 'productAmounts', onDelete: 'CASCADE' });
CustomPricingProduct.belongsTo(CustomPricing, { foreignKey: 'cp_id', as: 'pricingRule' });

CustomPricing.hasMany(CustomPricingVariant, { foreignKey: 'cp_id', as: 'variantAmounts', onDelete: 'CASCADE' });
CustomPricingVariant.belongsTo(CustomPricing, { foreignKey: 'cp_id', as: 'pricingRule' });


export default setUpAssociations;