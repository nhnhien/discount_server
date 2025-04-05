'use strict';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('custom_pricing', 'is_price_list', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'end_date', // Optional: nếu bạn muốn đặt sau trường end_date
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('custom_pricing', 'is_price_list');
  },
};
