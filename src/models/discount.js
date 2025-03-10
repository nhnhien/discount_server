import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Variant from './variant.js';
import Product from './product.js';
import Category from './category.js';

const Discount = sequelize.define(
  'Discount',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    discount_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    discount_type: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: false,
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    apply_to_product_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Product,
        key: 'id',
      },
      allowNull: true,
    },
    apply_to_variant_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Variant,
        key: 'id',
      },
      allowNull: true,
    },
    apply_to_category_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Category,
        key: 'id',
      },
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'discount',
    timestamps: false,
  }
);

export default Discount;
