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

const setUpAssociations = () => {
  // Role - User (1-M)
  Role.hasMany(User, { foreignKey: 'role_id', onDelete: 'CASCADE' });
  User.belongsTo(Role, { foreignKey: 'role_id' });

  // Market - Product (1-M)
  Market.hasMany(Product, { foreignKey: 'market_id', onDelete: 'CASCADE' });
  Product.belongsTo(Market, { foreignKey: 'market_id' });

  // Category - Product (1-M)
  Category.hasMany(Product, { foreignKey: 'category_id', as: 'products', onDelete: 'CASCADE' });
  Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

  // Product - Variant (1-M)
  Product.hasMany(Variant, { foreignKey: 'product_id', as: 'variants', onDelete: 'CASCADE' });
  Variant.belongsTo(Product, { foreignKey: 'product_id' });

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

  // Discount - Product (1-M)
  Product.hasMany(Discount, { foreignKey: 'apply_to_product_id', as: 'discounts', onDelete: 'CASCADE' });
  Discount.belongsTo(Product, { foreignKey: 'apply_to_product_id', as: 'product' });

  // Discount - Variant (1-M)
  Variant.hasMany(Discount, { foreignKey: 'apply_to_variant_id', as: 'discounts', onDelete: 'CASCADE' });
  Discount.belongsTo(Variant, { foreignKey: 'apply_to_variant_id', as: 'variant' });

  // Discount - Category (1-M)
  Category.hasMany(Discount, { foreignKey: 'apply_to_category_id', as: 'discounts', onDelete: 'CASCADE' });
  Discount.belongsTo(Category, { foreignKey: 'apply_to_category_id', as: 'category' });

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
      onDelete: 'CASCADE',
      as: 'products',
    });
    
    Product.belongsToMany(CustomPricing, {
      through: CustomPricingProduct,
      foreignKey: 'product_id',
      onDelete: 'CASCADE',
      as: 'cpRules',
    });
  
    //CustomPricing - Variant (M-M)
    CustomPricing.belongsToMany(Variant, {
      through: CustomPricingVariant,
      foreignKey: 'cp_id',
      onDelete: 'CASCADE',
      as: 'variants',
    });
    
    Variant.belongsToMany(CustomPricing, {
      through: CustomPricingVariant,
      foreignKey: 'variant_id',
      onDelete: 'CASCADE',
      as: 'cpRules',
    });
};

export default setUpAssociations;
