// 'use strict';

// export default {
//   async up(queryInterface, Sequelize) {
//     await queryInterface.addColumn('category', 'image_url', {
//       type: Sequelize.STRING,
//       allowNull: true,
//       after: 'description', 
//     });
//   },

//   async down(queryInterface) {
//     await queryInterface.removeColumn('category', 'image_url');
//   },
// };
'use strict';

export default {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('category');
    if (!table['image_url']) {
      await queryInterface.addColumn('category', 'image_url', {
        type: Sequelize.STRING,
        allowNull: true,
        after: 'description',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('category');
    if (table['image_url']) {
      await queryInterface.removeColumn('category', 'image_url');
    }
  },
};
