import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Image = sequelize.define(
  'Image',
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
    image_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'image',
    timestamps: true,
    underscored: true,
  }
);

export default Image;