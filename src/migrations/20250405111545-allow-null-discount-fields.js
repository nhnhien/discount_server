'use strict';

export default {
  async up(queryInterface, Sequelize) {
    // Cho phép discount_type nullable
    await queryInterface.changeColumn('custom_pricing', 'discount_type', {
      type: Sequelize.ENUM('decrement', 'percentage', 'fixed price'),
      allowNull: true,
    });

    // Cho phép discount_value nullable
    await queryInterface.changeColumn('custom_pricing', 'discount_value', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Đổi lại về notNull (rollback)
    await queryInterface.changeColumn('custom_pricing', 'discount_type', {
      type: Sequelize.ENUM('decrement', 'percentage', 'fixed price'),
      allowNull: false,
    });

    await queryInterface.changeColumn('custom_pricing', 'discount_value', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });
  },
};
