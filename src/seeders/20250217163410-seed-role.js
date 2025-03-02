'use strict';

import { QueryTypes } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    const existingRoles = await queryInterface.sequelize.query(
      "SELECT name FROM Role WHERE name IN ('owner', 'customer')",
      { type: QueryTypes.SELECT }
    );

    const existingRoleNames = existingRoles.map((role) => role.name);

    const rolesToInsert = [];
    if (!existingRoleNames.includes('owner')) {
      rolesToInsert.push({ name: 'owner', created_at: new Date(), updated_at: new Date() });
    }
    if (!existingRoleNames.includes('customer')) {
      rolesToInsert.push({ name: 'customer', created_at: new Date(), updated_at: new Date() });
    }

    if (rolesToInsert.length > 0) {
      await queryInterface.bulkInsert('Role', rolesToInsert);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Role', {
      name: ['owner', 'customer'],
    });
  },
};