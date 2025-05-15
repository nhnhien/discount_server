// 'use strict';

// export default {
//   async up(queryInterface, Sequelize) {
//     await queryInterface.addColumn('custom_pricing', 'is_active', {
//       type: Sequelize.BOOLEAN,
//       allowNull: false,
//       defaultValue: true,
//       after: 'is_price_list', // 👈 thêm sau cột `is_price_list` nếu DB hỗ trợ (MySQL)
//     });
//   },

//   async down(queryInterface) {
//     await queryInterface.removeColumn('custom_pricing', 'is_active');
//   },
// };
'use strict';

export default {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('custom_pricing');
    if (!table['is_active']) {
      await queryInterface.addColumn('custom_pricing', 'is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        after: 'is_price_list',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('custom_pricing');
    if (table['is_active']) {
      await queryInterface.removeColumn('custom_pricing', 'is_active');
    }
  },
};
