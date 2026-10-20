const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Participation = sequelize.define(
  "Participation",
  {
    participation_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    event_id: { type: DataTypes.INTEGER, allowNull: false },
    signup_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.STRING(20), defaultValue: "registered" },
    chat_left_at: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "participations", timestamps: false },
);

module.exports = Participation;
