import { DataTypes } from 'sequelize';
 import sequelize from '../config/database.js';
 
 const QBVariant = sequelize.define(
   'QBVariant',
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
     variant_id: {
       type: DataTypes.INTEGER,
       primaryKey: true,
       references: {
         model: 'variant',
         key: 'id',
       },
       onDelete: 'CASCADE',
     },
   },
   {
     tableName: 'qb_variant',
     timestamps: false,
     underscored: true,
   }
 );
 export default QBVariant;