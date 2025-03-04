import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Attribute = sequelize.define(
  'Attribute',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'attribute',
    timestamps: true,
    underscored: true,
  }
);
export default Attribute;