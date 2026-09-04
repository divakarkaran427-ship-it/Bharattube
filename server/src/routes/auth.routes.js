const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  logout,
  getCurrentUser,
  startGoogleLogin,
  completeGoogleLogin,
} = require("../controllers/auth.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");

const {
  loginValidator,
} = require("../validators/auth.validator");

// Public Routes
router.post("/login", loginValidator, validate, login);
router.get("/google", startGoogleLogin);
router.get("/google/callback", completeGoogleLogin);

// Protected Routes
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, getCurrentUser);

module.exports = router;
