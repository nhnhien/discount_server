'use strict';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('product_comparison', 'external_model_id', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'ID của biến thể sản phẩm từ marketplace (nếu có)',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('product_comparison', 'external_model_id');
  },
};
