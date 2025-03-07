import Category from './category.js';
import Market from './market.js';
import Product from './product.js';
import Role from './role.js';
import User from './user.js';
import Attribute from './attribute.js';
import AttributeValue from './attribute_value.js';
import VariantValue from './variant_value.js';
import Variant from './variant.js';

const setUpAssociations = () => {
 // Role - User (1-M)
 Role.hasMany(User, { foreignKey: 'role_id', onDelete: 'CASCADE' });
 User.belongsTo(Role, { foreignKey: 'role_id' });

 // Market - Product (1-M)
 Market.hasMany(Product, { foreignKey: 'market_id', onDelete: 'CASCADE' });
 Product.belongsTo(Market, { foreignKey: 'market_id' });

 // Category - Product (1-M)
 Category.hasMany(Product, { foreignKey: 'category_id', onDelete: 'CASCADE' });
 Product.belongsTo(Category, { foreignKey: 'category_id' });

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
};
export default setUpAssociations;