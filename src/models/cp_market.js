import { DataTypes } from 'sequelize';
 import sequelize from '../config/database.js';
 
 const CustomPricingMarket = sequelize.define(
   'CustomPricingMarket',
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
     market_id: {
       type: DataTypes.INTEGER,
       primaryKey: true,
       references: {
         model: 'market',
         key: 'id',
       },
       onDelete: 'CASCADE',
       onUpdate: 'CASCADE',
     },
   },
   {
     tableName: 'cp_market',
     timestamps: false,
     underscored: true,
     indexes: [
       {
         unique: true,
         fields: ['cp_id', 'market_id'],
       },
     ],
   }
 );
 
 export default CustomPricingMarket;