import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import PriceHistory from './price_history.js';

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
Product.beforeUpdate(async (product, options) => {
  if (product.changed('original_price') || product.changed('final_price')) {
    const oldProduct = await Product.findByPk(product.id);
    if (product.changed('original_price')) {
      await PriceHistory.create({
        product_id: product.id,
        variant_id: null,
        old_price: oldProduct.original_price || 0,
        new_price: product.original_price || 0,
        changed_by: options.user?.id || null,
        change_reason: options.change_reason || 'Cập nhật giá gốc',
        price_type: 'original',
      });
    }

    if (product.changed('final_price')) {
      await PriceHistory.create({
        product_id: product.id,
        variant_id: null,
        old_price: oldProduct.final_price || 0,
        new_price: product.final_price || 0,
        changed_by: options.user?.id || null,
        change_reason: options.change_reason || 'Cập nhật giá bán',
        price_type: 'final',
      });
    }
  }
});
export default Product;
