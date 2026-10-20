const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { Notification } = require("../models");

router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.userId },
      order: [["created_at", "DESC"]],
      limit: 50,
    });
    res.json({ notifications });
  } catch (err) {
    console.error("GET /notifications error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.put("/:id/read", auth, async (req, res) => {
  try {
    const notif = await Notification.findByPk(req.params.id);
    if (!notif)
      return res.status(404).json({ error: "Notification not found." });
    if (notif.user_id !== req.userId)
      return res.status(403).json({ error: "Permission denied." });

    await notif.update({ is_read: true });
    res.json({ notification: notif });
  } catch (err) {
    console.error("PUT /notifications/:id/read error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.put("/read-conversation", auth, async (req, res) => {
  try {
    const { type, refId, refType } = req.body;
    if (!type || refId == null || !refType) {
      return res.status(400).json({ error: "Missing parameters." });
    }

    await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: req.userId,
          type,
          ref_id: refId,
          ref_type: refType,
          is_read: false,
        },
      },
    );
    res.json({ message: "Conversation marked as read." });
  } catch (err) {
    console.error("PUT /notifications/read-conversation error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.put("/read-all", auth, async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      {
        where: { user_id: req.userId, is_read: false },
      },
    );
    res.json({ message: "All notifications marked as read." });
  } catch (err) {
    console.error("PUT /notifications/read-all error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.delete("/", auth, async (req, res) => {
  try {
    await Notification.destroy({ where: { user_id: req.userId } });
    res.json({ message: "All notifications deleted." });
  } catch (err) {
    console.error("DELETE /notifications error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
