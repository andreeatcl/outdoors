const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./jwt");
const { handleSocketEvents } = require("../socket/handlers");

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL ?? "http://localhost:5173",
      credentials: true,
    },
  });

  // socket auth - client sends jwt
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      socket.userId = payload.userId;
    } catch {}
    next();
  });

  io.on("connection", (socket) => {
    console.log(
      `Socket connected: ${socket.id} (user: ${socket.userId ?? "guest"})`,
    );
    handleSocketEvents(io, socket);
    socket.on("disconnect", () =>
      console.log(`Socket disconnected: ${socket.id}`),
    );
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
