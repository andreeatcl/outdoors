const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Message = sequelize.define(
  "Message",
  {
    message_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sender_id: { type: DataTypes.INTEGER, allowNull: true },
    receiver_id: { type: DataTypes.INTEGER, allowNull: true },
    event_id: { type: DataTypes.INTEGER, allowNull: true },
    content: { type: DataTypes.STRING(255), allowNull: false },
    is_system: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "messages", timestamps: false },
);

module.exports = Message;
