const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const authOptional = require("../middleware/authOptional");
const { User, Event, Participation, sequelize } = require("../models");
const { Op } = require("sequelize");
const { publicFields, buildUserProfile } = require("../services/userProfile");
const meRoutes = require("./meRoutes");

router.use("/me", meRoutes);

router.get("/search", auth, async (req, res) => {
  try {
    const q = req.query.q?.trim().toLowerCase();
    if (!q || q.length < 2) return res.json({ users: [] });

    const like = (col) =>
      sequelize.where(sequelize.fn("LOWER", sequelize.col(col)), {
        [Op.like]: `%${q}%`,
      });

    const where = {
      user_id: { [Op.ne]: req.userId },
      [Op.or]: [like("username"), like("first_name"), like("last_name")],
    };

    const users = await User.findAll({
      where,
      attributes: publicFields,
      limit: 20,
    });
    res.json({ users });
  } catch (err) {
    console.error("GET /users/search error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.get("/:id", authOptional, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: publicFields,
    });
    if (!user) return res.status(404).json({ error: "User not found." });

    res.json(await buildUserProfile(user, req.userId));
  } catch (err) {
    console.error("GET /users/:id error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.get("/:id/events", async (req, res) => {
  try {
    const organized = await Event.findAll({
      where: { organizer_id: req.params.id },
      include: [{ model: Participation, attributes: ["user_id", "status"] }],
      order: [["start_date", "DESC"]],
    });

    const participations = await Participation.findAll({
      where: { user_id: req.params.id },
      include: [
        {
          model: Event,
          include: [
            { model: Participation, attributes: ["user_id", "status"] },
          ],
        },
      ],
    });
    const joined = participations
      .map((p) => p.Event)
      .filter((e) => e && e.organizer_id !== Number(req.params.id));

    res.json({ organized, joined });
  } catch (err) {
    console.error("GET /users/:id/events error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
