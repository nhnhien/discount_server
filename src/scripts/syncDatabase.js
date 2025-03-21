import setUpAssociations from '../models/associations.js';
import sequelize from '../config/database.js';

setUpAssociations();
const syncDatabase = async () => {
  try {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
  } finally {
    await sequelize.close();
  }
};

syncDatabase();