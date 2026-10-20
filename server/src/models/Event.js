const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const fields = {
  event_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  organizer_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.STRING(255), allowNull: true },
  event_type: { type: DataTypes.STRING(50), allowNull: false },
  start_date: { type: DataTypes.DATE, allowNull: false },
  duration: { type: DataTypes.INTEGER, allowNull: false },
  max_participants: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.STRING(20), defaultValue: "upcoming" },
  address: { type: DataTypes.STRING(255), allowNull: true },
  coordinates: { type: DataTypes.GEOMETRY("POINT", 4326), allowNull: false },
};

const Event = sequelize.define("Event", fields, {
  tableName: "events",
  timestamps: false,
});

module.exports = Event;
