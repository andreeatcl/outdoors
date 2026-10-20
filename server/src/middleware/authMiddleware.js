const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token." });
  }
  try {
    const payload = jwt.verify(
      auth.slice(7),
      process.env.JWT_SECRET ?? "dev-secret",
    );
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}

module.exports = authMiddleware;
