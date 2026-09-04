const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  addView,
  getVideoViews,
} = require("../controllers/view.controller");

// Add View
router.post("/:videoId", authMiddleware, addView);

// Get Video Views
router.get("/:videoId", getVideoViews);

module.exports = router;
