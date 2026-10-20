const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Friendship = sequelize.define(
  "Friendship",
  {
    friendship_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    requester_id: { type: DataTypes.INTEGER, allowNull: false },
    addressee_id: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING(20), defaultValue: "pending" },
  },
  { tableName: "friendships", timestamps: false },
);

module.exports = Friendship;
