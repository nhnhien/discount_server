'use strict';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('cp_product', 'amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      after: 'product_id', // optional
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('cp_product', 'amount');
  },
};
