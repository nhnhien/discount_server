'use strict';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('product_comparison', 'external_price', {
      type: Sequelize.DECIMAL(20, 2),
      allowNull: false,
      comment: 'Giá sản phẩm từ marketplace, có thể rất lớn (chuyển từ USD sang VND)',
    });

    await queryInterface.changeColumn('product_comparison', 'our_price', {
      type: Sequelize.DECIMAL(20, 2),
      allowNull: false,
      comment: 'Giá sản phẩm của chúng ta',
    });

    await queryInterface.changeColumn('product_comparison', 'price_difference', {
      type: Sequelize.DECIMAL(20, 2),
      allowNull: false,
      comment: 'Chênh lệch giá giữa sản phẩm ngoài và của chúng ta',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('product_comparison', 'external_price', {
      type: Sequelize.BIGINT,
      allowNull: false,
    });

    await queryInterface.changeColumn('product_comparison', 'our_price', {
      type: Sequelize.BIGINT,
      allowNull: false,
    });

    await queryInterface.changeColumn('product_comparison', 'price_difference', {
      type: Sequelize.BIGINT,
      allowNull: false,
    });
  }
};
