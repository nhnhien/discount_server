import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ProductComparison = sequelize.define(
  'ProductComparison',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'product',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    variant_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'variant',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    marketplace: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Name of the marketplace (e.g., shopee, lazada, tiki)',
    },
    external_product_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'ID of the product in the external marketplace',
    },
    external_product_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    external_product_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    external_product_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    external_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    our_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    price_difference: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    price_difference_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    is_cheaper: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    external_rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    external_model_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'ID của biến thể sản phẩm từ marketplace (nếu có)',
    },
  },
  {
    tableName: 'product_comparison',
    timestamps: true,
    underscored: true,
  }
);

export default ProductComparison;