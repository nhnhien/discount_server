import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Product = sequelize.define(
  'Product',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'category',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    market_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'market',
        key: 'id',
      },
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    has_variant: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    original_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    final_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    tableName: 'product',
    timestamps: true,
    underscored: true,
  }
);

export default Product;