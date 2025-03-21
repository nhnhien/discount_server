import { DataTypes } from 'sequelize';
 import sequelize from '../config/database.js';
 
 const Address = sequelize.define(
   'Address',
   {
     id: {
       type: DataTypes.INTEGER,
       primaryKey: true,
       autoIncrement: true,
       allowNull: false,
     },
     user_id: {
       type: DataTypes.INTEGER,
       allowNull: false,
       references: {
         model: 'user',
         key: 'id',
       },
       onDelete: 'CASCADE',
       onUpdate: 'CASCADE',
     },
     full_name: {
       type: DataTypes.STRING(100),
       allowNull: false,
     },
     address: {
       type: DataTypes.TEXT,
       allowNull: false,
     },
     city: {
       type: DataTypes.STRING(100),
       allowNull: false,
     },
     phone_number: {
       type: DataTypes.STRING(20),
       allowNull: false,
     },
     is_default: {
       type: DataTypes.BOOLEAN,
       defaultValue: false,
     },
   },
   {
     tableName: 'address',
     timestamps: true,
     underscored: true,
   }
 );
 
 export default Address;