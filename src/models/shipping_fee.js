import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ShippingFee = sequelize.define(
  'ShippingFee',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    region: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    method: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fee: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: 'shipping_fee',
    timestamps: true,
    underscored: true,
  }
);

export default ShippingFee;
