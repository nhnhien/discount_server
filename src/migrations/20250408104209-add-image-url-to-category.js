'use strict';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('category', 'image_url', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'description', 
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('category', 'image_url');
  },
};
