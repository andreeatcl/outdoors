require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");

const { connectDB } = require("./config/db");
const { syncModels } = require("./models");
const { initSocket } = require("./config/socket");
const {
  startEventStatusCron,
  runEventStatusUpdate,
} = require("./cron/eventStatus");

const authRoutes = require("./routes/authRoutes");
const usersRoutes = require("./routes/usersRoutes");
const eventsRoutes = require("./routes/eventsRoutes");
const eventParticipationRoutes = require("./routes/eventParticipationRoutes");
const friendshipsRoutes = require("./routes/friendshipsRoutes");
const messagesRoutes = require("./routes/messagesRoutes");
const notificationsRoutes = require("./routes/notificationsRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/events", eventParticipationRoutes);
app.use("/api/friendships", friendshipsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status ?? 500).json({ error: err.message ?? "Server error" });
});

initSocket(server);

const PORT = process.env.PORT ?? 5000;

async function start() {
  await connectDB();
  await syncModels();
  await runEventStatusUpdate();
  startEventStatusCron();
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start();

module.exports = { app, server };
