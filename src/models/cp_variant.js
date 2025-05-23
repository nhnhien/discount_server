import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CustomPricingVariant = sequelize.define(
  'CustomPricingVariant',
  {
    cp_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'custom_pricing',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    variant_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'variant',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true, // Giá tùy chỉnh, có thể null nếu chưa đặt
    },
  },
  {
    tableName: 'cp_variant',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['cp_id', 'variant_id'],
      },
    ],
  }
);
export default CustomPricingVariant;
