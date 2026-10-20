const {
  Message,
  User,
  Event,
  Friendship,
  Participation,
} = require("../models");
const { Op } = require("sequelize");
const {
  createAndEmitNotification,
  hasUnreadNotification,
} = require("../services/notificationService");

function handleSocketEvents(io, socket) {
  if (socket.userId) {
    socket.join(`user_${socket.userId}`);
  }

  socket.on("join_room", ({ roomId }) => {
    socket.join(roomId);
  });

  socket.on("leave_room", ({ roomId }) => {
    socket.leave(roomId);
  });

  socket.on(
    "send_message",
    async ({ roomId, content, receiverId, eventId }) => {
      if (!socket.userId) {
        return socket.emit("message_error", { error: "Not authenticated." });
      }
      if (!content?.trim()) {
        return socket.emit("message_error", {
          error: "Message cannot be empty.",
        });
      }
      if (!receiverId && !eventId) {
        return socket.emit("message_error", {
          error: "Invalid conversation.",
        });
      }

      try {
        if (receiverId) {
          const friendship = await Friendship.findOne({
            where: {
              status: "accepted",
              [Op.or]: [
                { requester_id: socket.userId, addressee_id: receiverId },
                { requester_id: receiverId, addressee_id: socket.userId },
              ],
            },
          });
          if (!friendship) {
            return socket.emit("message_error", {
              error: "You can only message friends.",
            });
          }
        }

        if (eventId) {
          const participation = await Participation.findOne({
            where: { user_id: socket.userId, event_id: eventId },
          });
          if (!participation || participation.chat_left_at) {
            return socket.emit("message_error", {
              error: "You can no longer send messages in this conversation.",
            });
          }
        }

        const saved = await Message.create({
          sender_id: socket.userId,
          receiver_id: receiverId ?? null,
          event_id: eventId ?? null,
          content: content.trim(),
        });

        const sender = await User.findByPk(socket.userId, {
          attributes: [
            "user_id",
            "username",
            "first_name",
            "last_name",
            "avatar_url",
          ],
        });

        const message = {
          message_id: saved.message_id,
          sender_id: saved.sender_id,
          receiver_id: saved.receiver_id,
          event_id: saved.event_id,
          content: saved.content,
          created_at: saved.created_at,
          sender: sender?.toJSON() ?? null,
        };

        io.to(roomId).emit("receive_message", { roomId, message });

        if (receiverId) {
          const alreadyUnread = await hasUnreadNotification({
            userId: receiverId,
            type: "dm_message",
            refId: socket.userId,
            refType: "dm",
          });
          if (!alreadyUnread) {
            await createAndEmitNotification({
              userId: receiverId,
              type: "dm_message",
              content: `${sender.first_name} ${sender.last_name} ți-a trimis un mesaj.`,
              refId: socket.userId,
              refType: "dm",
            });
          }
        }

        if (eventId) {
          const event = await Event.findByPk(eventId, {
            attributes: ["title"],
          });
          const participants = await Participation.findAll({
            where: { event_id: eventId },
          });
          for (const p of participants) {
            if (p.user_id === socket.userId || p.chat_left_at) continue;
            const alreadyUnread = await hasUnreadNotification({
              userId: p.user_id,
              type: "event_message",
              refId: eventId,
              refType: "event_chat",
            });
            if (!alreadyUnread) {
              await createAndEmitNotification({
                userId: p.user_id,
                type: "event_message",
                content: `Un participant a scris în conversația "${event?.title ?? ""}".`,
                refId: eventId,
                refType: "event_chat",
              });
            }
          }
        }
      } catch (err) {
        console.error("Msg save failed:", err.message);
        socket.emit("message_error", {
          error: "Message could not be saved.",
        });
      }
    },
  );
}

module.exports = { handleSocketEvents };
