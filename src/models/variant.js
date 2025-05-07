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
  try {
    if (variant.changed('original_price') || variant.changed('final_price')) {
      const oldOriginalPrice = variant.previous('original_price') || 0;
      const oldFinalPrice = variant.previous('final_price') || 0;

      const newOriginalPrice = variant.original_price || 0;
      const newFinalPrice = variant.final_price || 0;

      const historyRecords = [];

      if (variant.changed('original_price')) {
        historyRecords.push({
          product_id: variant.product_id,
          variant_id: variant.id,
          old_price: oldOriginalPrice,
          new_price: newOriginalPrice,
          changed_by: options.user?.id || null,
          change_reason: options.change_reason || 'Update variant original price',
          price_type: 'original',
        });
      }

      if (variant.changed('final_price')) {
        historyRecords.push({
          product_id: variant.product_id,
          variant_id: variant.id,
          old_price: oldFinalPrice,
          new_price: newFinalPrice,
          changed_by: options.user?.id || null,
          change_reason: options.change_reason || 'Update variant selling price',
          price_type: 'final',
        });
      }

      const transaction = options.transaction;

      if (transaction) {
        await Promise.all(historyRecords.map((record) => PriceHistory.create(record, { transaction })));
      } else {
        for (const record of historyRecords) {
          await createWithRetry(async () => PriceHistory.create(record), 3);
        }
      }
    }
  } catch (error) {
    console.error('Error in Variant.beforeUpdate hook:', error);
  }
});

Variant.afterCreate(async (variant, options) => {
  try {
    const historyRecords = [];

    if (variant.original_price) {
      historyRecords.push({
        product_id: variant.product_id,
        variant_id: variant.id,
        old_price: 0,
        new_price: variant.original_price,
        changed_by: options.user?.id || null,
        change_reason: options.change_reason || 'Create new variant',
        price_type: 'original',
      });
    }

    if (variant.final_price) {
      historyRecords.push({
        product_id: variant.product_id,
        variant_id: variant.id,
        old_price: 0,
        new_price: variant.final_price,
        changed_by: options.user?.id || null,
        change_reason: options.change_reason || 'Create new variant',
        price_type: 'final',
      });
    }

    const transaction = options.transaction;

    if (transaction) {
      await Promise.all(historyRecords.map((record) => PriceHistory.create(record, { transaction })));
    } else {
      await sequelize
        .transaction(async (t) => {
          await Promise.all(historyRecords.map((record) => PriceHistory.create(record, { transaction: t })));
        })
        .catch(async (error) => {
          if (error.parent && error.parent.code === 'ER_LOCK_WAIT_TIMEOUT') {
            for (const record of historyRecords) {
              await createWithRetry(async () => PriceHistory.create(record), 3);
            }
          } else {
            throw error;
          }
        });
    }
  } catch (error) {
    console.error('Error in Variant.afterCreate hook:', error);
  }
});

async function createWithRetry(createFn, maxRetries = 3) {
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      return await createFn();
    } catch (error) {
      if (
        error.name === 'SequelizeDatabaseError' &&
        error.parent &&
        (error.parent.code === 'ER_LOCK_WAIT_TIMEOUT' || error.parent.errno === 1205) &&
        retryCount < maxRetries - 1
      ) {
        retryCount++;
        const delay = 500 * Math.pow(2, retryCount);
        console.log(`Retrying attempt ${retryCount} after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

export default Variant;
