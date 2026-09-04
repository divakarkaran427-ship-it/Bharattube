const express = require("express");
const router = express.Router();
const {
  startWatchingSession,
  saveWatchProgress,
  saveWatchedSeconds,
  saveCompletionPercentage,
} = require("../controllers/watch.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/:id/start", authMiddleware, startWatchingSession);
router.post("/:id/progress", authMiddleware, saveWatchProgress);
router.post("/:id/watched-seconds", authMiddleware, saveWatchedSeconds);
router.post("/:id/completion", authMiddleware, saveCompletionPercentage);

module.exports = router;
