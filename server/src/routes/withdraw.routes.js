const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  toggleSubscription,
  getSubscribers,
} = require("../controllers/subscription.controller");

// ==========================
// Subscribe / Unsubscribe
// POST /api/v1/subscriptions/:id
// ==========================
router.post("/:id", authMiddleware, toggleSubscription);

// ==========================
// Get Subscribers
// GET /api/v1/subscriptions/:id
// ==========================
router.get("/:id", authMiddleware, getSubscribers);

module.exports = router;