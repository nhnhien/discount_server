import { DataTypes } from 'sequelize';
 import sequelize from '../config/database.js';
 
 const Delivery = sequelize.define(
   'Delivery',
   {
     id: {
       type: DataTypes.INTEGER,
       primaryKey: true,
       autoIncrement: true,
       allowNull: false,
     },
     order_id: {
       type: DataTypes.INTEGER,
       allowNull: false,
       unique: true,
       references: {
         model: 'order',
         key: 'id',
       },
       onDelete: 'CASCADE',
       onUpdate: 'CASCADE',
     },
     tracking_number: {
       type: DataTypes.STRING(100),
       allowNull: true,
     },
     carrier: {
       type: DataTypes.STRING(100),
       allowNull: true,
     },
     status: {
       type: DataTypes.ENUM('preparing', 'shipped', 'in_transit', 'delivered', 'failed', 'returned'),
       defaultValue: 'preparing',
     },
     shipped_at: {
       type: DataTypes.DATE,
       allowNull: true,
     },
     delivered_at: {
       type: DataTypes.DATE,
       allowNull: true,
     },
     estimated_delivery: {
       type: DataTypes.DATE,
       allowNull: true,
     },
     shipping_method: {
       type: DataTypes.STRING(100),
       allowNull: true,
     },
     notes: {
       type: DataTypes.TEXT,
       allowNull: true,
     },
     updated_by: {
       type: DataTypes.INTEGER,
       allowNull: true,
       references: {
         model: 'user',
         key: 'id',
       },
     },
   },
   {
     tableName: 'delivery',
     timestamps: true,
     underscored: true,
   }
 );
 
 export default Delivery;