'use strict';

export default {
  async up(queryInterface, Sequelize) {
    // 1. Mở rộng cột price_difference_percentage
    await queryInterface.changeColumn('product_comparison', 'price_difference_percentage', {
      type: Sequelize.DECIMAL(8, 2),
      allowNull: false,
    });

    // 2. Thêm cột country
    await queryInterface.addColumn('product_comparison', 'country', {
      type: Sequelize.STRING(10),
      allowNull: false,
      defaultValue: 'VN',
      comment: 'Country of the marketplace (e.g., VN, US, UK)',
    });

    // 3. Cập nhật comment của cột marketplace
    await queryInterface.changeColumn('product_comparison', 'marketplace', {
      type: Sequelize.STRING(50),
      allowNull: false,
      comment: 'Name of the marketplace (e.g., tiki, amazon, ebay)',
    });

    // 4. Thêm index cho cột country
    await queryInterface.addIndex('product_comparison', ['country']);
  },

  async down(queryInterface, Sequelize) {
    // 1. Trả lại kích thước cột price_difference_percentage
    await queryInterface.changeColumn('product_comparison', 'price_difference_percentage', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
    });

    // 2. Xóa cột country
    await queryInterface.removeColumn('product_comparison', 'country');

    // 3. Trả lại comment của cột marketplace
    await queryInterface.changeColumn('product_comparison', 'marketplace', {
      type: Sequelize.STRING(50),
      allowNull: false,
      comment: 'Name of the marketplace (e.g., shopee, lazada, tiki)',
    });

    // 4. Xóa index của cột country nếu cần
    await queryInterface.removeIndex('product_comparison', ['country']);
  },
};