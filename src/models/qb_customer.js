import { DataTypes } from 'sequelize';
 import sequelize from '../config/database.js';
 
 const QBCustomer = sequelize.define(
   'QBCustomer',
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
     customer_id: {
       type: DataTypes.INTEGER,
       primaryKey: true,
       references: {
         model: 'user',
         key: 'id',
       },
       onDelete: 'CASCADE',
     },
   },
   {
     tableName: 'qb_customer',
     timestamps: false,
     underscored: true,
   }
 );
 
 export default QBCustomer;