const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

const {
  getSettings,
  updateSettings,
} = require("../controllers/settings.controller");

// Get Settings
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getSettings
);

// Update Settings
router.patch(
  "/",
  authMiddleware,
  adminMiddleware,
  updateSettings
);

module.exports = router;