const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const {
  Message,
  User,
  Participation,
  Event,
  Friendship,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

const senderAttrs = [
  "user_id",
  "username",
  "first_name",
  "last_name",
  "avatar_url",
];

const PAGE_SIZE = 30;

router.get("/dm/:userId", auth, async (req, res) => {
  try {
    const otherUserId = Number(req.params.userId);
    const before = req.query.before ? new Date(req.query.before) : null;

    const where = {
      event_id: null,
      [Op.or]: [
        { is_system: false, sender_id: req.userId, receiver_id: otherUserId },
        { sender_id: otherUserId, receiver_id: req.userId },
      ],
    };
    if (before) where.created_at = { [Op.lt]: before };

    const messages = await Message.findAll({
      where,
      include: [{ model: User, as: "sender", attributes: senderAttrs }],
      order: [["created_at", "DESC"]],
      limit: PAGE_SIZE + 1,
    });

    const hasMore = messages.length > PAGE_SIZE;
    res.json({
      messages: messages.slice(0, PAGE_SIZE).reverse(),
      hasMore,
    });
  } catch (err) {
    console.error("GET /messages/dm/:userId error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.get("/event/:eventId", auth, async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    const before = req.query.before ? new Date(req.query.before) : null;

    // you can read a gc if you're a participant or if you used to be (an active) one.
    const isParticipant = await Participation.findOne({
      where: { user_id: req.userId, event_id: eventId },
    });
    if (!isParticipant) {
      const hasSentMessage = await Message.findOne({
        where: { sender_id: req.userId, event_id: eventId, receiver_id: null },
      });
      if (!hasSentMessage)
        return res
          .status(403)
          .json({ error: "You are not a participant in this event." });
    }

    const where = {
      event_id: eventId,
      [Op.or]: [
        { receiver_id: null },
        { receiver_id: req.userId, is_system: true },
      ],
    };
    if (before) where.created_at = { [Op.lt]: before };

    const messages = await Message.findAll({
      where,
      include: [{ model: User, as: "sender", attributes: senderAttrs }],
      order: [["created_at", "DESC"]],
      limit: PAGE_SIZE + 1,
    });

    const hasMore = messages.length > PAGE_SIZE;
    res.json({
      messages: messages.slice(0, PAGE_SIZE).reverse(),
      hasMore,
    });
  } catch (err) {
    console.error("GET /messages/event/:eventId error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

// merge DMs & events
router.get("/conversations", auth, async (req, res) => {
  try {
    const dmMessages = await Message.findAll({
      where: {
        event_id: null,
        is_system: false,
        [Op.or]: [{ sender_id: req.userId }, { receiver_id: req.userId }],
      },
      include: [
        { model: User, as: "sender", attributes: senderAttrs },
        { model: User, as: "receiver", attributes: senderAttrs },
      ],
      order: [["created_at", "DESC"]],
    });

    const dmMap = new Map();
    for (const msg of dmMessages) {
      const otherId =
        msg.sender_id === req.userId ? msg.receiver_id : msg.sender_id;
      if (otherId == null) continue;
      if (!dmMap.has(otherId)) {
        const otherUser =
          msg.sender_id === req.userId ? msg.receiver : msg.sender;
        if (!otherUser) continue;
        dmMap.set(otherId, {
          type: "dm",
          userId: otherId,
          user: otherUser,
          lastMessage: msg.content,
          lastMessageAt: msg.created_at,
          lastSenderId: msg.sender_id,
        });
      }
    }

    const friendIds = new Set();
    if (dmMap.size > 0) {
      const partnerIds = [...dmMap.keys()];
      const friendships = await Friendship.findAll({
        where: {
          status: "accepted",
          [Op.or]: [
            { requester_id: req.userId, addressee_id: { [Op.in]: partnerIds } },
            { addressee_id: req.userId, requester_id: { [Op.in]: partnerIds } },
          ],
        },
      });
      for (const f of friendships) {
        const otherId =
          f.requester_id === req.userId ? f.addressee_id : f.requester_id;
        friendIds.add(otherId);
      }
    }

    const participations = await Participation.findAll({
      where: { user_id: req.userId },
      include: [
        {
          model: Event,
          attributes: [
            "event_id",
            "title",
            "event_type",
            "status",
            "start_date",
            "duration",
            "max_participants",
            "address",
          ],
        },
      ],
    });
    const eventConvos = [];
    const currentEventIds = new Set(participations.map((p) => p.event_id));

    for (const p of participations) {
      const [lastMsg, participantsCount] = await Promise.all([
        Message.findOne({
          where: { event_id: p.event_id, receiver_id: null },
          order: [["created_at", "DESC"]],
          include: [{ model: User, as: "sender", attributes: senderAttrs }],
        }),
        Participation.count({ where: { event_id: p.event_id } }),
      ]);
      const eventData = p.Event
        ? { ...p.Event.toJSON(), participants_count: participantsCount }
        : null;
      eventConvos.push({
        type: "event",
        eventId: p.event_id,
        event: eventData,
        lastMessage: lastMsg?.content ?? null,
        lastMessageAt: lastMsg?.created_at ?? null,
        lastSender: lastMsg?.sender ?? null,
        isFormerParticipant: false,
        isChatLeft: !!p.chat_left_at,
      });
    }

    const sentInEvents = await Message.findAll({
      where: {
        sender_id: req.userId,
        event_id: { [Op.ne]: null },
        receiver_id: null,
      },
      attributes: ["event_id"],
      group: ["event_id"],
      raw: true,
    });
    const formerEventIds = sentInEvents
      .map((m) => m.event_id)
      .filter((id) => !currentEventIds.has(id));

    for (const eventId of formerEventIds) {
      const [event, lastMsg, participantsCount] = await Promise.all([
        Event.findByPk(eventId, {
          attributes: [
            "event_id",
            "title",
            "event_type",
            "status",
            "start_date",
            "duration",
            "max_participants",
            "address",
          ],
        }),
        Message.findOne({
          where: { event_id: eventId, receiver_id: null },
          order: [["created_at", "DESC"]],
          include: [{ model: User, as: "sender", attributes: senderAttrs }],
        }),
        Participation.count({ where: { event_id: eventId } }),
      ]);
      if (!event) continue;
      eventConvos.push({
        type: "event",
        eventId,
        event: { ...event.toJSON(), participants_count: participantsCount },
        lastMessage: lastMsg?.content ?? null,
        lastMessageAt: lastMsg?.created_at ?? null,
        lastSender: lastMsg?.sender ?? null,
        isFormerParticipant: true,
      });
    }

    const dmConvos = Array.from(dmMap.values()).map((c) => ({
      ...c,
      isFormerFriend: !friendIds.has(c.userId),
    }));

    const conversations = [...dmConvos, ...eventConvos].sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });

    res.json({ conversations });
  } catch (err) {
    console.error("GET /messages/conversations error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
