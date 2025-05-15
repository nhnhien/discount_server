// 'use strict';

// export default {
//   async up(queryInterface, Sequelize) {
//     await queryInterface.addColumn('quantity_break', 'is_active', {
//       type: Sequelize.BOOLEAN,
//       allowNull: false,
//       defaultValue: true,
//       after: 'end_date', // hoặc bỏ nếu DB không hỗ trợ
//     });
//   },

//   async down(queryInterface) {
//     await queryInterface.removeColumn('quantity_break', 'is_active');
//   },
// };
'use strict';

export default {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('quantity_break');
    if (!table['is_active']) {
      await queryInterface.addColumn('quantity_break', 'is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        after: 'end_date', // hoặc bỏ nếu không cần
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('quantity_break');
    if (table['is_active']) {
      await queryInterface.removeColumn('quantity_break', 'is_active');
    }
  },
};
