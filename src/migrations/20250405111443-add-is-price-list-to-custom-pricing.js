// 'use strict';

// export default {
//   async up(queryInterface, Sequelize) {
//     await queryInterface.addColumn('custom_pricing', 'is_price_list', {
//       type: Sequelize.BOOLEAN,
//       allowNull: false,
//       defaultValue: false,
//       after: 'end_date', // Optional: nếu bạn muốn đặt sau trường end_date
//     });
//   },

//   async down(queryInterface) {
//     await queryInterface.removeColumn('custom_pricing', 'is_price_list');
//   },
// };
'use strict';

export default {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('custom_pricing');
    if (!table['is_price_list']) {
      await queryInterface.addColumn('custom_pricing', 'is_price_list', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        after: 'end_date', // Optional
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('custom_pricing');
    if (table['is_price_list']) {
      await queryInterface.removeColumn('custom_pricing', 'is_price_list');
    }
  },
};
