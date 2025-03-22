import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const QBMarket = sequelize.define(
  'QBMarket',
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
    market_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'market',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'qb_market',
    timestamps: false,
    underscored: true,
  }
);

export default QBMarket;
