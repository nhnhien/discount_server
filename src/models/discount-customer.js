import { DataTypes } from 'sequelize';
 import sequelize from '../config/database.js';
 
 const DiscountCustomer = sequelize.define(
   'DiscountCustomer',
   {
     id: {
       type: DataTypes.INTEGER,
       primaryKey: true,
       autoIncrement: true,
     },
     discount_id: {
       type: DataTypes.INTEGER,
       allowNull: false,
       references: {
         model: 'discount',
         key: 'id',
       },
       onDelete: 'CASCADE',
     },
     user_id: {
       type: DataTypes.INTEGER,
       allowNull: false,
       references: {
         model: 'user',
         key: 'id',
       },
       onDelete: 'CASCADE',
     },
   },
   {
     tableName: 'discount_customer',
     timestamps: false,
     underscored: true,
   }
 );
 export default DiscountCustomer;