import setUpAssociations from '../models/associations.js';
import sequelize from '../config/database.js';

setUpAssociations();
const syncDatabase = async () => {
  try {
    console.log('🔄 Đang đồng bộ database...');
    await sequelize.sync({ force: true });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Đã đóng kết nối database.');
  }
};

syncDatabase();