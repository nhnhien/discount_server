import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CustomPricingProduct = sequelize.define(
  'CustomPricingProduct',
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
    product_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'product',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true, // Cho phép null để tương thích khi chưa nhập
    },
  },
  {
    tableName: 'cp_product',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['cp_id', 'product_id'],
      },
    ],
  }
);
export default CustomPricingProduct;
