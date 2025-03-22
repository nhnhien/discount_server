import { DataTypes } from 'sequelize';
 import sequelize from '../config/database.js';
 const QBProduct = sequelize.define(
   'QBProduct',
   {
     quantity_break_id: {
       type: DataTypes.INTEGER,
       primaryKey: true,
       references: {
         model: 'quantity_break',
         key: 'id',
       },
       onDelete: 'CASCADE',
     },
     product_id: {
       type: DataTypes.INTEGER,
       primaryKey: true,
       references: {
         model: 'product',
         key: 'id',
       },
       onDelete: 'CASCADE',
     },
   },
   {
     tableName: 'qb_product',
     timestamps: false,
     underscored: true,
   }
 );
 
 export default QBProduct;