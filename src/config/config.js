export default {
    development: {
      username: 'root',
      password: 'Ai@123456',
      database: 'discount',
      host: 'localhost',
      dialect: process.env.DB_DIALECT || 'mysql',
      port: process.env.DB_PORT,
    },
  };