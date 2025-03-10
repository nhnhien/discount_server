import { QueryTypes } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export const up = async (queryInterface) => {
  const existingRoles = await queryInterface.sequelize.query(`SELECT id FROM role WHERE id IN (1, 2)`, {
    type: QueryTypes.SELECT,
  });

  const existingRoleIds = existingRoles.map((role) => role.id);

  const rolesToInsert = [
    { id: 1, name: 'owner', created_at: new Date(), updated_at: new Date() },
    { id: 2, name: 'customer', created_at: new Date(), updated_at: new Date() },
  ].filter((role) => !existingRoleIds.includes(role.id));

  if (rolesToInsert.length > 0) {
    await queryInterface.bulkInsert('role', rolesToInsert);
  }
};

export const down = async (queryInterface) => {
  await queryInterface.bulkDelete('Role', { id: [1, 2] });
};
