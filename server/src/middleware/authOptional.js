const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/jwt");

function authOptional(req, _res, next) {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(auth.slice(7), JWT_SECRET);
      req.userId = payload.userId;
    } catch {}
  }
  next();
}

module.exports = authOptional;
