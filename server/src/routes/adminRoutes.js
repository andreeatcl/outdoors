const router = require("express").Router();
const { Op } = require("sequelize");
const auth = require("../middleware/authMiddleware");
const adminAuth = require("../middleware/adminMiddleware");
const {
  User,
  Event,
  Participation,
  Friendship,
  Message,
  Notification,
  sequelize,
} = require("../models");
const { formatEvent } = require("../services/eventFormatter");

router.use(auth, adminAuth);

const userAttrs = [
  "user_id",
  "username",
  "email",
  "first_name",
  "last_name",
  "avatar_url",
  "role",
  "creation_date",
];

router.get("/users", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 10);
    const q = req.query.q?.trim().toLowerCase();

    const where = q
      ? {
          [Op.or]: [
            { username: { [Op.iLike]: `%${q}%` } },
            { email: { [Op.iLike]: `%${q}%` } },
            { first_name: { [Op.iLike]: `%${q}%` } },
            { last_name: { [Op.iLike]: `%${q}%` } },
          ],
        }
      : {};

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: userAttrs,
      order: [["creation_date", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    });

    res.json({ users: rows, total: count, page, limit });
  } catch (err) {
    console.error("GET /admin/users error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role." });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    if (user.role === "admin" && role !== "admin") {
      const adminCount = await User.count({ where: { role: "admin" } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: "Cannot remove the last admin." });
      }
    }

    await user.update({ role });
    res.json({ user: { user_id: user.user_id, role: user.role } });
  } catch (err) {
    console.error("PATCH /admin/users/:id/role error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (userId === req.userId) {
      return res
        .status(400)
        .json({ error: "You cannot delete your own account from here." });
    }
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    await sequelize.transaction(async (t) => {
      const organizedEvents = await Event.findAll({
        where: { organizer_id: userId },
        attributes: ["event_id"],
        transaction: t,
      });
      const eventIds = organizedEvents.map((e) => e.event_id);

      if (eventIds.length) {
        await Message.destroy({
          where: { event_id: eventIds },
          transaction: t,
        });
        await Participation.destroy({
          where: { event_id: eventIds },
          transaction: t,
        });
        await Event.destroy({ where: { event_id: eventIds }, transaction: t });
      }

      await Participation.destroy({
        where: { user_id: userId },
        transaction: t,
      });
      await Message.destroy({
        where: { [Op.or]: [{ sender_id: userId }, { receiver_id: userId }] },
        transaction: t,
      });
      await Friendship.destroy({
        where: {
          [Op.or]: [{ requester_id: userId }, { addressee_id: userId }],
        },
        transaction: t,
      });
      await Notification.destroy({
        where: { user_id: userId },
        transaction: t,
      });

      await user.destroy({ transaction: t });
    });

    res.json({ message: "User deleted." });
  } catch (err) {
    console.error("DELETE /admin/users/:id error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.get("/events", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 10);
    const q = req.query.q?.trim().toLowerCase();

    const where = q ? { title: { [Op.iLike]: `%${q}%` } } : {};

    const { rows, count } = await Event.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "organizer",
          attributes: ["user_id", "username", "first_name", "last_name"],
        },
        {
          model: Participation,
          attributes: ["participation_id", "user_id", "status"],
          include: [{ model: User, attributes: userAttrs }],
        },
      ],
      order: [["start_date", "DESC"]],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });

    const events = rows.map((e) => formatEvent(e, req.userId));

    res.json({ events, total: count, page, limit });
  } catch (err) {
    console.error("GET /admin/events error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.patch("/events/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["upcoming", "ongoing", "finished", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found." });

    await event.update({ status });
    res.json({ event: { event_id: event.event_id, status: event.status } });
  } catch (err) {
    console.error("PATCH /admin/events/:id/status error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.delete("/events/:id", async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found." });

    await sequelize.transaction(async (t) => {
      await Message.destroy({
        where: { event_id: event.event_id },
        transaction: t,
      });
      await Participation.destroy({
        where: { event_id: event.event_id },
        transaction: t,
      });
      await event.destroy({ transaction: t });
    });

    res.json({ message: "Event deleted." });
  } catch (err) {
    console.error("DELETE /admin/events/:id error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
