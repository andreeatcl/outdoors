const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { User } = require("../models");

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET ?? "dev-secret", {
    expiresIn: "7d",
  });

const sanitizeUser = (u) => ({
  user_id: u.user_id,
  username: u.username,
  email: u.email,
  first_name: u.first_name,
  last_name: u.last_name,
  bio: u.bio,
  avatar_url: u.avatar_url,
  role: u.role,
  creation_date: u.creation_date,
});

router.post(
  "/register",
  body("email").isEmail().withMessage("Invalid email."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
  body("username")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters."),
  body("first_name").notEmpty().withMessage("First name is required."),
  body("last_name").notEmpty().withMessage("Last name is required."),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password, username, first_name, last_name } = req.body;

      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail)
        return res.status(409).json({ error: "Email is already in use." });

      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername)
        return res.status(409).json({ error: "Username is already taken." });

      const password_hash = await bcrypt.hash(password, 12);
      const user = await User.create({
        username,
        email,
        first_name,
        last_name,
        password_hash,
      });

      const token = signToken(user.user_id);
      res.status(201).json({ token, user: sanitizeUser(user) });
    } catch (err) {
      console.error("Register error:", err.message);
      res.status(500).json({ error: "Registration failed." });
    }
  },
);

router.post(
  "/login",
  body("email").isEmail(),
  body("password").notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user)
        return res.status(401).json({ error: "Invalid email or password." });

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid)
        return res.status(401).json({ error: "Invalid email or password." });

      const token = signToken(user.user_id);
      res.json({ token, user: sanitizeUser(user) });
    } catch (err) {
      console.error("Login error:", err.message);
      res.status(500).json({ error: "Login failed." });
    }
  },
);

const auth = require("../middleware/authMiddleware");
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("GET /me error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out." });
});

module.exports = router;
