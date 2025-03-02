'use strict';

import { hashSync } from 'bcrypt';
import { QueryTypes } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    const roles = await queryInterface.sequelize.query(
      `SELECT id, name FROM \`Role\` WHERE name IN ('owner', 'customer');`,
      { type: QueryTypes.SELECT }
    );
    console.log('🚀 ~ up ~ roles:', roles);

    const roleMap = {};
    roles.forEach((role) => {
      roleMap[role.name] = role.id;
    });
    await queryInterface.bulkInsert('User', [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: hashSync('password123', 10),
        role_id: roleMap['owner'],
        create_at: new Date(),
        update_at: new Date(),
      },
      {
        username: 'user1',
        email: 'user1@example.com',
        password: hashSync('password123', 10),
        role_id: roleMap['customer'],
        create_at: new Date(),
        update_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('User', null, {});
  },
};