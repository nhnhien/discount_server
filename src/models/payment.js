import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Payment = sequelize.define(
  'Payment',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    txn_ref: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    response_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'payments',
    underscored: true,
    timestamps: true,
  }
);

export default Payment;