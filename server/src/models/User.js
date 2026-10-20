const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const User = sequelize.define(
  "User",
  {
    user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    first_name: { type: DataTypes.STRING(50), allowNull: false },
    last_name: { type: DataTypes.STRING(50), allowNull: false },
    bio: { type: DataTypes.TEXT, allowNull: true },
    avatar_url: { type: DataTypes.STRING(255), allowNull: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING(20), defaultValue: "user" },
    creation_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "users", timestamps: false },
);

module.exports = User;
