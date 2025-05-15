// 'use strict';

// export default {
//   async up(queryInterface, Sequelize) {
//     await queryInterface.addColumn('product_comparison', 'external_model_id', {
//       type: Sequelize.STRING(100),
//       allowNull: true,
//       comment: 'ID của biến thể sản phẩm từ marketplace (nếu có)',
//     });
//   },

//   async down(queryInterface) {
//     await queryInterface.removeColumn('product_comparison', 'external_model_id');
//   },
// };
'use strict';

export default {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('product_comparison');
    if (!table['external_model_id']) {
      await queryInterface.addColumn('product_comparison', 'external_model_id', {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'ID của biến thể sản phẩm từ marketplace (nếu có)',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('product_comparison');
    if (table['external_model_id']) {
      await queryInterface.removeColumn('product_comparison', 'external_model_id');
    }
  },
};
