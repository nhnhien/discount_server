'use strict';

export const up = async (queryInterface, Sequelize) => {
  const existingCategories = await queryInterface.sequelize.query(
    `SELECT name FROM category WHERE name IN ('Shirt', 'Pants')`,
    { type: Sequelize.QueryTypes.SELECT }
  );

  const existingNames = existingCategories.map((category) => category.name);

  const categories = [
    { name: 'Shirt', created_at: new Date(), updated_at: new Date() },
    { name: 'Pants', created_at: new Date(), updated_at: new Date() },
  ].filter((category) => !existingNames.includes(category.name));

  if (categories.length > 0) {
    await queryInterface.bulkInsert('category', categories);
  }
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.bulkDelete('category', null, {});
};
