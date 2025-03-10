'use strict';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('discount', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      discount_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      discount_type: {
        type: Sequelize.ENUM('percentage', 'fixed'),
        allowNull: false,
      },
      value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      apply_to_product_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'product',
          key: 'id',
        },
        allowNull: true,
        onDelete: 'CASCADE',
      },
      apply_to_variant_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'variant',
          key: 'id',
        },
        allowNull: true,
        onDelete: 'CASCADE',
      },
      apply_to_category_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'category',
          key: 'id',
        },
        allowNull: true,
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('discounts');
  },
};
