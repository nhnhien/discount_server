import { DataTypes } from 'sequelize';
 import sequelize from '../config/database.js';
 
 const CustomPricing = sequelize.define(
   'CustomPricing',
   {
     id: {
       type: DataTypes.INTEGER,
       primaryKey: true,
       autoIncrement: true,
       allowNull: false,
     },
     title: {
       type: DataTypes.STRING,
       allowNull: false,
     },
     description: {
       type: DataTypes.TEXT,
       allowNull: true,
     },
     discount_type: {
       type: DataTypes.ENUM('decrement', 'percentage', 'fixed price'),
       allowNull: false,
     },
     discount_value: {
       type: DataTypes.DECIMAL(10, 2),
       allowNull: false,
     },
     start_date: {
       type: DataTypes.DATEONLY,
       allowNull: false,
     },
     end_date: {
       type: DataTypes.DATEONLY,
       allowNull: false,
     },
   },
   {
     tableName: 'custom_pricing',
     timestamps: true,
     underscored: true,
   }
 );
 
 export default CustomPricing;