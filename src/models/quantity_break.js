// models/quantityBreak.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const QuantityBreak = sequelize.define(
  'QuantityBreak',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    qb_rules: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidRules(value) {
          if (!Array.isArray(value) || value.length === 0) {
            throw new Error('qb_rules must be a non-empty array');
          }
          value.forEach((rule) => {
            if (!rule.quantity || typeof rule.quantity !== 'number' || rule.quantity <= 0) {
              throw new Error('Each rule must have a positive quantity');
            }

            if (!rule.discount_type || !['percentage', 'fixed'].includes(rule.discount_type)) {
              throw new Error('Each rule must have a valid discount_type (percentage or fixed)');
            }

            if (rule.value === undefined || typeof rule.value !== 'number' || rule.value < 0) {
              throw new Error('Each rule must have a non-negative value');
            }
          });
        },
      },
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'quantity_break',
    timestamps: true,
    underscored: true,
  }
);

export default QuantityBreak;