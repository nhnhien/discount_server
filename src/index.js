import app from './app.js';
import sequelize from './config/database.js';
import AttributeValue from './models/attribute_value.js';
import Product from './models/product.js';
import Variant from './models/variant.js';

const PORT = process.env.PORT || 8005;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối thành công với MySQL!');
  } catch (error) {
    console.error('❌ Lỗi kết nối MySQL:', error);
  }
})();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});