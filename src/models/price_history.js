import { DataTypes } from 'sequelize';
 import sequelize from '../config/database.js';
 
 const PriceHistory = sequelize.define(
   'PriceHistory',
   {
     id: {
       type: DataTypes.INTEGER,
       primaryKey: true,
       autoIncrement: true,
       allowNull: false,
     },
     product_id: {
       type: DataTypes.INTEGER,
       allowNull: true,
       references: {
         model: 'product',
         key: 'id',
       },
       onDelete: 'CASCADE',
       onUpdate: 'CASCADE',
     },
     variant_id: {
       type: DataTypes.INTEGER,
       allowNull: true,
       references: {
         model: 'variant',
         key: 'id',
       },
       onDelete: 'CASCADE',
       onUpdate: 'CASCADE',
     },
     old_price: {
       type: DataTypes.DECIMAL(15, 2),
       allowNull: false,
     },
     new_price: {
       type: DataTypes.DECIMAL(15, 2),
       allowNull: false,
     },
     changed_by: {
       type: DataTypes.INTEGER,
       allowNull: true,
       references: {
         model: 'user',
         key: 'id',
       },
       onDelete: 'SET NULL',
       onUpdate: 'CASCADE',
     },
     change_reason: {
       type: DataTypes.STRING(255),
       allowNull: true,
     },
     price_type: {
       type: DataTypes.ENUM('original', 'final'),
       defaultValue: 'final',
       allowNull: false,
     },
   },
   {
     tableName: 'price_history',
     timestamps: true,
     underscored: true,
     createdAt: 'changed_at',
     updatedAt: false,
   }
 );
 
 export default PriceHistory;