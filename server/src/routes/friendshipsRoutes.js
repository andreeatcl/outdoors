const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { User, Friendship, Message } = require("../models");
const { Op } = require("sequelize");
const { getIO } = require("../config/socket");
const {
  createAndEmitNotification,
} = require("../services/notificationService");

const userAttrs = [
  "user_id",
  "username",
  "first_name",
  "last_name",
  "avatar_url",
];

router.get("/", auth, async (req, res) => {
  try {
    const friendships = await Friendship.findAll({
      where: {
        status: "accepted",
        [Op.or]: [{ requester_id: req.userId }, { addressee_id: req.userId }],
      },
      include: [
        { model: User, as: "requester", attributes: userAttrs },
        { model: User, as: "addressee", attributes: userAttrs },
      ],
    });

    const friends = friendships.map((f) => {
      const friend = f.requester_id === req.userId ? f.addressee : f.requester;
      return { friendship_id: f.friendship_id, ...friend.toJSON() };
    });

    res.json({ friends });
  } catch (err) {
    console.error("GET /friendships error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.get("/requests", auth, async (req, res) => {
  try {
    const requests = await Friendship.findAll({
      where: { addressee_id: req.userId, status: "pending" },
      include: [{ model: User, as: "requester", attributes: userAttrs }],
    });
    res.json({ requests });
  } catch (err) {
    console.error("GET /friendships/requests error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.post("/:userId", auth, async (req, res) => {
  try {
    const targetId = Number(req.params.userId);
    if (targetId === req.userId)
      return res.status(400).json({ error: "You cannot befriend yourself." });

    const targetUser = await User.findByPk(targetId);
    if (!targetUser) return res.status(404).json({ error: "User not found." });

    const existing = await Friendship.findOne({
      where: {
        [Op.or]: [
          { requester_id: req.userId, addressee_id: targetId },
          { requester_id: targetId, addressee_id: req.userId },
        ],
      },
    });
    if (existing) {
      if (existing.status === "accepted")
        return res.status(400).json({ error: "Already friends." });
      if (existing.status === "pending")
        return res.status(400).json({ error: "Request already sent." });
      if (existing.status === "rejected") {
        await existing.update({
          requester_id: req.userId,
          addressee_id: targetId,
          status: "pending",
        });
        return res.status(201).json({ friendship: existing });
      }
    }

    const friendship = await Friendship.create({
      requester_id: req.userId,
      addressee_id: targetId,
    });

    const sender = await User.findByPk(req.userId, { attributes: userAttrs });
    await createAndEmitNotification({
      userId: targetId,
      type: "friend_request",
      content: `${sender.first_name} ${sender.last_name} ți-a trimis o cerere de prietenie.`,
      refId: req.userId,
      refType: "user",
    });

    res.status(201).json({ friendship });
  } catch (err) {
    console.error("POST /friendships/:userId error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.put("/:id/accept", auth, async (req, res) => {
  try {
    const friendship = await Friendship.findByPk(req.params.id);
    if (!friendship)
      return res.status(404).json({ error: "Request not found." });
    if (friendship.addressee_id !== req.userId)
      return res.status(403).json({ error: "Permission denied." });
    if (friendship.status !== "pending")
      return res.status(400).json({ error: "Request is no longer pending." });

    await friendship.update({ status: "accepted" });

    const accepter = await User.findByPk(req.userId, { attributes: userAttrs });
    const requester = await User.findByPk(friendship.requester_id, {
      attributes: userAttrs,
    });

    await createAndEmitNotification({
      userId: friendship.requester_id,
      type: "friend_accepted",
      content: `${accepter.first_name} ${accepter.last_name} ți-a acceptat cererea de prietenie.`,
      refId: req.userId,
      refType: "user",
    });

    const dmRoomId = `dm_${Math.min(req.userId, friendship.requester_id)}_${Math.max(req.userId, friendship.requester_id)}`;
    const [msgForAccepter, msgForRequester] = await Message.bulkCreate([
      {
        sender_id: friendship.requester_id,
        receiver_id: req.userId,
        is_system: true,
        content: `Ești acum prieten cu ${requester.first_name} ${requester.last_name}.`,
      },
      {
        sender_id: req.userId,
        receiver_id: friendship.requester_id,
        is_system: true,
        content: `Ești acum prieten cu ${accepter.first_name} ${accepter.last_name}.`,
      },
    ]);
    const io = getIO();
    if (io) {
      io.to(`user_${req.userId}`).emit("receive_message", {
        roomId: dmRoomId,
        message: { ...msgForAccepter.toJSON(), sender: null },
        statusUpdate: { isFormerFriend: false },
      });
      io.to(`user_${friendship.requester_id}`).emit("receive_message", {
        roomId: dmRoomId,
        message: { ...msgForRequester.toJSON(), sender: null },
        statusUpdate: { isFormerFriend: false },
      });
    }

    res.json({ friendship });
  } catch (err) {
    console.error("PUT /friendships/:id/accept error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.put("/:id/reject", auth, async (req, res) => {
  try {
    const friendship = await Friendship.findByPk(req.params.id);
    if (!friendship)
      return res.status(404).json({ error: "Request not found." });
    if (friendship.addressee_id !== req.userId)
      return res.status(403).json({ error: "Permission denied." });

    await friendship.update({ status: "rejected" });
    res.json({ message: "Request declined." });
  } catch (err) {
    console.error("PUT /friendships/:id/reject error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const friendship = await Friendship.findByPk(req.params.id);
    if (!friendship)
      return res.status(404).json({ error: "Friendship not found." });

    const isInvolved =
      friendship.requester_id === req.userId ||
      friendship.addressee_id === req.userId;
    if (!isInvolved)
      return res.status(403).json({ error: "Permission denied." });

    const otherId =
      friendship.requester_id === req.userId
        ? friendship.addressee_id
        : friendship.requester_id;

    const [me, other] = await Promise.all([
      User.findByPk(req.userId, { attributes: userAttrs }),
      User.findByPk(otherId, { attributes: userAttrs }),
    ]);

    await friendship.destroy();

    const dmRoomId = `dm_${Math.min(req.userId, otherId)}_${Math.max(req.userId, otherId)}`;
    const [msgForMe, msgForOther] = await Message.bulkCreate([
      {
        sender_id: otherId,
        receiver_id: req.userId,
        is_system: true,
        content: `Nu mai ești prieten cu ${other.first_name} ${other.last_name}.`,
      },
      {
        sender_id: req.userId,
        receiver_id: otherId,
        is_system: true,
        content: `Nu mai ești prieten cu ${me.first_name} ${me.last_name}.`,
      },
    ]);
    const io = getIO();
    if (io) {
      io.to(`user_${req.userId}`).emit("receive_message", {
        roomId: dmRoomId,
        message: { ...msgForMe.toJSON(), sender: null },
        statusUpdate: { isFormerFriend: true },
      });
      io.to(`user_${otherId}`).emit("receive_message", {
        roomId: dmRoomId,
        message: { ...msgForOther.toJSON(), sender: null },
        statusUpdate: { isFormerFriend: true },
      });
    }

    res.json({ message: "Friend removed." });
  } catch (err) {
    console.error("DELETE /friendships/:id error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
