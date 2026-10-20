const router = require("express").Router();
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { User, Participation, Friendship } = require("../models");

router.put("/", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    const allowed = ["first_name", "last_name", "username", "bio"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.username) {
      const existing = await User.findOne({
        where: { username: updates.username, user_id: { [Op.ne]: req.userId } },
      });
      if (existing)
        return res.status(409).json({ error: "Username is already taken." });
    }

    await user.update(updates);
    const { password_hash, ...safe } = user.toJSON();
    res.json({ user: safe });
  } catch (err) {
    console.error("PUT /users/me error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.put("/password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: "Both fields are required." });
    if (newPassword.length < 6)
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters." });

    const user = await User.findByPk(req.userId);
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: "Current password is incorrect." });

    user.password_hash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: "Password changed." });
  } catch (err) {
    console.error("PUT /users/me/password error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.post("/avatar", auth, upload.single("avatar"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Missing file." });
  try {
    const avatar_url = `/uploads/${req.file.filename}`;
    await User.update({ avatar_url }, { where: { user_id: req.userId } });
    res.json({ avatar_url });
  } catch (err) {
    console.error("POST /users/me/avatar error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.delete("/avatar", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (user?.avatar_url) {
      const filePath = path.join(__dirname, "..", "..", user.avatar_url);
      fs.unlink(filePath, () => {});
    }
    await User.update({ avatar_url: null }, { where: { user_id: req.userId } });
    res.json({ avatar_url: null });
  } catch (err) {
    console.error("DELETE /users/me/avatar error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.delete("/", auth, async (req, res) => {
  try {
    await Participation.destroy({ where: { user_id: req.userId } });
    await Friendship.destroy({
      where: {
        [Op.or]: [{ requester_id: req.userId }, { addressee_id: req.userId }],
      },
    });
    await User.destroy({ where: { user_id: req.userId } });
    res.json({ message: "Account deleted." });
  } catch (err) {
    console.error("DELETE /users/me error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
