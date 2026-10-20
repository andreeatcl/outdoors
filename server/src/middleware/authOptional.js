const jwt = require("jsonwebtoken");

function authOptional(req, _res, next) {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(
        auth.slice(7),
        process.env.JWT_SECRET ?? "dev-secret",
      );
      req.userId = payload.userId;
    } catch {}
  }
  next();
}

module.exports = authOptional;
