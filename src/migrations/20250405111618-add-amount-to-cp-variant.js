// 'use strict';

// export default {
//   async up(queryInterface, Sequelize) {
//     await queryInterface.addColumn('cp_variant', 'amount', {
//       type: Sequelize.DECIMAL(10, 2),
//       allowNull: true,
//       after: 'variant_id',
//     });
//   },

//   async down(queryInterface) {
//     await queryInterface.removeColumn('cp_variant', 'amount');
//   },
// };
'use strict';

export default {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('cp_variant');
    if (!table['amount']) {
      await queryInterface.addColumn('cp_variant', 'amount', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        after: 'variant_id',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('cp_variant');
    if (table['amount']) {
      await queryInterface.removeColumn('cp_variant', 'amount');
    }
  },
};
