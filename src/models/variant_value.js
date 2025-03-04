import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const VariantValue = sequelize.define(
  'VariantValue',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    variant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'variant',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    attribute_value_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'attribute_value',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'variant_value',
    timestamps: true,
    underscored: true,
  }
);

export default VariantValue;