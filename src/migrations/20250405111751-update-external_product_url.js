'use strict';

export default {
  async up(queryInterface, Sequelize) {
    // Mở rộng độ dài cột external_product_url
    await queryInterface.changeColumn('product_comparison', 'external_product_url', {
      type: Sequelize.TEXT('long'), // dùng TEXT thay vì STRING vì URL dài
      allowNull: true,
      comment: 'URL của sản phẩm từ marketplace (có thể rất dài)',
    });
  },

  async down(queryInterface, Sequelize) {
    // Khôi phục lại external_product_url về kiểu STRING (giả sử trước đó là STRING(255))
    await queryInterface.changeColumn('product_comparison', 'external_product_url', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'URL của sản phẩm từ marketplace',
    });
  },
};
