import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import PriceHistory from './price_history.js';

const Variant = sequelize.define(
  'Variant',
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
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    original_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    final_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'variant',
    timestamps: true,
    underscored: true,
  }
);
Variant.beforeUpdate(async (variant, options) => {
  if (variant.changed('original_price') || variant.changed('final_price')) {
    const oldVariant = await Variant.findByPk(variant.id);
    if (variant.changed('original_price')) {
      await PriceHistory.create({
        product_id: variant.product_id,
        variant_id: variant.id,
        old_price: oldVariant.original_price || 0,
        new_price: variant.original_price || 0,
        changed_by: options.user?.id || null,
        change_reason: options.change_reason || 'Cập nhật giá gốc biến thể',
        price_type: 'original',
      });
    }
    if (variant.changed('final_price')) {
      await PriceHistory.create({
        product_id: variant.product_id,
        variant_id: variant.id,
        old_price: oldVariant.final_price || 0,
        new_price: variant.final_price || 0,
        changed_by: options.user?.id || null,
        change_reason: options.change_reason || 'Cập nhật giá bán biến thể',
        price_type: 'final',
      });
    }
  }
});

Variant.afterCreate(async (variant, options) => {
  if (variant.original_price) {
    await PriceHistory.create({
      product_id: variant.product_id,
      variant_id: variant.id,
      old_price: 0,
      new_price: variant.original_price,
      changed_by: options.user?.id || null,
      change_reason: options.change_reason || 'Tạo biến thể mới',
      price_type: 'original',
    });
  }

  if (variant.final_price) {
    await PriceHistory.create({
      product_id: variant.product_id,
      variant_id: variant.id,
      old_price: 0,
      new_price: variant.final_price,
      changed_by: options.user?.id || null,
      change_reason: options.change_reason || 'Tạo biến thể mới',
      price_type: 'final',
    });
  }
});
export default Variant;
