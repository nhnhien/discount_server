import { DataTypes } from 'sequelize';
 import sequelize from '../config/database.js';
 
 const CustomPricingCustomer = sequelize.define(
   'CustomPricingCustomer',
   {
     cp_id: {
       type: DataTypes.INTEGER,
       primaryKey: true,
       references: {
         model: 'custom_pricing',
         key: 'id',
       },
       onDelete: 'CASCADE',
       onUpdate: 'CASCADE',
     },
     customer_id: {
       type: DataTypes.INTEGER,
       primaryKey: true,
       references: {
         model: 'user',
         key: 'id',
       },
       onDelete: 'CASCADE',
       onUpdate: 'CASCADE',
     },
   },
   {
     tableName: 'cp_customer',
     timestamps: false,
     underscored: true,
     indexes: [
       {
         unique: true,
         fields: ['cp_id', 'customer_id'],
       },
     ],
   }
 );
 export default CustomPricingCustomer;