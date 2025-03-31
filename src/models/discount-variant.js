import { DataTypes } from 'sequelize';
 import sequelize from '../config/database.js';
 
 const DiscountVariant = sequelize.define(
   'DiscountVariant',
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
     variant_id: {
       type: DataTypes.INTEGER,
       allowNull: false,
       references: {
         model: 'variant',
         key: 'id',
       },
       onDelete: 'CASCADE',
     },
   },
   {
     tableName: 'discount_variant',
     timestamps: false,
     underscored: true,
   }
 );
 export default DiscountVariant;