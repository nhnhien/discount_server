import sequelize from '../config/database.js';
import setUpAssociations from './associations.js';
import Role from './role.js';
import User from './user.js';
import Category from './category.js';
import Market from './market.js';
import Product from './product.js';
import Variant from './variant.js';
import Attribute from './attribute.js';
import AttributeValue from './attribute_value.js';
import VariantValue from './variant_value.js';
import Discount from './discount.js';
import CustomPricing from './custom_pricing.js';
import CustomPricingCustomer from './cp_customer.js';
import CustomPricingMarket from './cp_market.js';
import CustomPricingProduct from './cp_product.js';
import CustomPricingVariant from './cp_variant.js';
import Cart from './cart.js';
import CartItem from './cart_item.js';
import Address from './address.js';
import PriceHistory from './price_history.js';
import QuantityBreak from './quantity_break.js';
import QBCustomer from './qb_customer.js';
import QBMarket from './qb_market.js';
import QBProduct from './qb_product.js';
import QBVariant from './qb_variant.js';
import DiscountCustomer from './discount-customer.js';
import DiscountProduct from './discount-product.js';
import DiscountVariant from './discount-variant.js';
import Order from './order.js';
import OrderItem from './order_item.js';
import Delivery from './delivery.js';
import Payment from './payment.js';

setUpAssociations();

export {
  sequelize,
  Role,
  User,
  Category,
  Market,
  Product,
  Variant,
  Attribute,
  AttributeValue,
  VariantValue,
  Discount,
  CustomPricing,
  CustomPricingCustomer,
  CustomPricingMarket,
  CustomPricingProduct,
  CustomPricingVariant,
  Cart,
  CartItem,
  Address,
  PriceHistory,
  QuantityBreak,
  QBCustomer,
  QBMarket,
  QBProduct,
  QBVariant,
  DiscountCustomer,
  DiscountProduct,
  DiscountVariant,
  Order,
  OrderItem,
  Delivery,
  Payment,
};