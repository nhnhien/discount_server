// models/Cart.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Cart = sequelize.define(
  'Cart',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'user',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('active', 'converted', 'abandoned'),
      defaultValue: 'active',
    },
    discount_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    applied_discount_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    shipping_fee: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    tax_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    shipping_address_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'address',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'cart',
    timestamps: true,
    underscored: true,
  }
);

export default Cart;