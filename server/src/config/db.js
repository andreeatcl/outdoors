const { Sequelize } = require("sequelize");

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL is required.");
}

const sequelize = new Sequelize(dbUrl, {
  dialect: "postgres",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  dialectOptions: {
    ssl:
      process.env.DATABASE_SSL === "true"
        ? { require: true, rejectUnauthorized: false }
        : false,
  },
});

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected.");
  } catch (err) {
    console.error("❌ DB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = { sequelize, connectDB };
