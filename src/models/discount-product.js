import { DataTypes } from 'sequelize';
 import sequelize from '../config/database.js';
 
 const DiscountProduct = sequelize.define(
   'DiscountProduct',
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
     product_id: {
       type: DataTypes.INTEGER,
       allowNull: false,
       references: {
         model: 'product',
         key: 'id',
       },
       onDelete: 'CASCADE',
     },
   },
   {
     tableName: 'discount_product',
     timestamps: false,
     underscored: true,
   }
 );
 
 export default DiscountProduct;