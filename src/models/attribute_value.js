import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AttributeValue = sequelize.define(
  'AttributeValue',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    attribute_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'attribute',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'attribute_value',
    timestamps: true,
    underscored: true,
  }
);

export default AttributeValue;