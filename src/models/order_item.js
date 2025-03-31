import { DataTypes } from 'sequelize';
 import sequelize from '../config/database.js';
 
 const OrderItem = sequelize.define(
   'OrderItem',
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
       references: {
         model: 'order',
         key: 'id',
       },
       onDelete: 'CASCADE',
       onUpdate: 'CASCADE',
     },
     product_id: {
       type: DataTypes.INTEGER,
       allowNull: false,
       references: {
         model: 'product',
         key: 'id',
       },
       onDelete: 'RESTRICT',
       onUpdate: 'CASCADE',
     },
     variant_id: {
       type: DataTypes.INTEGER,
       allowNull: true,
       references: {
         model: 'variant',
         key: 'id',
       },
       onDelete: 'RESTRICT',
       onUpdate: 'CASCADE',
     },
     quantity: {
       type: DataTypes.INTEGER,
       allowNull: false,
       defaultValue: 1,
     },
     unit_price: {
       type: DataTypes.DECIMAL(10, 2),
       allowNull: false,
     },
     original_price: {
       type: DataTypes.DECIMAL(10, 2),
       allowNull: false,
     },
     subtotal: {
       type: DataTypes.DECIMAL(12, 2),
       allowNull: false,
     },
     item_discount: {
       type: DataTypes.DECIMAL(10, 2),
       allowNull: false,
       defaultValue: 0.0,
     },
     product_name: {
       type: DataTypes.STRING,
       allowNull: false,
     },
     variant_name: {
       type: DataTypes.STRING,
       allowNull: true,
     },
     sku: {
       type: DataTypes.STRING,
       allowNull: true,
     },
   },
   {
     tableName: 'order_item',
     timestamps: true,
     underscored: true,
     hooks: {
       beforeCreate: (item) => {
         item.subtotal = parseFloat(item.unit_price) * item.quantity;
       },
       beforeUpdate: (item) => {
         if (item.changed('unit_price') || item.changed('quantity')) {
           item.subtotal = parseFloat(item.unit_price) * item.quantity;
         }
       },
     },
   }
 );
 
 export default OrderItem;