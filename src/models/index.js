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

setUpAssociations();

export { sequelize, Role, User, Category, Market, Product, Variant, Attribute, AttributeValue, VariantValue };