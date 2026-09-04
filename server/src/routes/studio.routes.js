const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  getDashboard,
  getStudioVideos,
} = require("../controllers/studio.controller");

// ==========================
// Protected Routes
// ==========================

// Creator Dashboard
router.get("/dashboard", authMiddleware, getDashboard);

// Creator Videos
router.get("/videos", authMiddleware, getStudioVideos);

module.exports = router;