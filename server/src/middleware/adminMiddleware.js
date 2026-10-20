const { User } = require("../models");

async function adminMiddleware(req, res, next) {
  try {
    const user = await User.findByPk(req.userId, { attributes: ["role"] });
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    next();
  } catch (err) {
    console.error("adminMiddleware error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
}

module.exports = adminMiddleware;
