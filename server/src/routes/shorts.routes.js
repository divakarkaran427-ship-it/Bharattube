const express = require("express");
const router = express.Router();

const {
  getShortsFeed,
} = require("../controllers/shorts.controller");

// ==========================
// Public Routes
// ==========================

// Shorts Feed
router.get("/feed", getShortsFeed);

module.exports = router;