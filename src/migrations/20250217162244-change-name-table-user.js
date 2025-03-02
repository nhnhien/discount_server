'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameTable('Users', 'User');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameTable('User', 'Users');
  },
};