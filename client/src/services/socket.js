import { io } from "socket.io-client";

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;
  socket = io(import.meta.env.VITE_SOCKET_URL ?? "http://localhost:5000", {
    auth: { token },
    transports: ["websocket"],
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function joinRoom(roomId) {
  socket?.emit("join_room", { roomId });
}
export function leaveRoom(roomId) {
  socket?.emit("leave_room", { roomId });
}
export function sendSocketMessage(roomId, content, opts = {}) {
  socket?.emit("send_message", { roomId, content, ...opts });
}
