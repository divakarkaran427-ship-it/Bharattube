const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  addToHistory,
  clearMyHistory,
  deleteHistoryItem,
  getMyContinueWatching,
  getMyHistory,
} = require("../controllers/watchHistory.controller");

// ==========================
// Add / Update Watch History
// POST /api/v1/history/:id
// ==========================
router.post("/:id", authMiddleware, addToHistory);

// ==========================
// Get My Watch History
// GET /api/v1/history
// ==========================
router.get("/", authMiddleware, getMyHistory);

// ==========================
// Continue Watching
// GET /api/v1/history/continue-watching
// ==========================
router.get("/continue-watching", authMiddleware, getMyContinueWatching);

// ==========================
// Clear My Watch History
// DELETE /api/v1/history
// ==========================
router.delete("/", authMiddleware, clearMyHistory);

// ==========================
// Remove One History Item
// DELETE /api/v1/history/:videoId
// ==========================
router.delete("/:videoId", authMiddleware, deleteHistoryItem);

module.exports = router;
