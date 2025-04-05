'use strict';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_comparison', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'product',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      variant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'variant',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      marketplace: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Name of the marketplace (e.g., shopee, lazada, tiki)',
      },
      external_product_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'ID of the product in the external marketplace',
      },
      external_product_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      external_product_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      external_product_image: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      external_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      our_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      price_difference: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      price_difference_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      is_cheaper: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      external_rating: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
      },
      sku: {
        type: Sequelize.STRING(100),
        allowNull: true,
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

    // Add indexes for faster querying
    await queryInterface.addIndex('product_comparison', ['product_id']);
    await queryInterface.addIndex('product_comparison', ['variant_id']);
    await queryInterface.addIndex('product_comparison', ['marketplace']);
    await queryInterface.addIndex('product_comparison', ['sku']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_comparison');
  },
};