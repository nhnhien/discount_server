export const up = async (queryInterface, Sequelize) => {
  const existingMarkets = await queryInterface.sequelize.query(
    `SELECT name FROM market WHERE name IN ('VietNam', 'US-UK')`,
    { type: Sequelize.QueryTypes.SELECT }
  );

  const existingNames = existingMarkets.map((market) => market.name);

  const markets = [
    { name: 'VietNam', currency: 'VND', created_at: new Date(), updated_at: new Date() },
    { name: 'US-UK', currency: 'USD', created_at: new Date(), updated_at: new Date() },
  ].filter((market) => !existingNames.includes(market.name));

  if (markets.length > 0) {
    await queryInterface.bulkInsert('market', markets);
  }
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.bulkDelete('market', null, {});
};
