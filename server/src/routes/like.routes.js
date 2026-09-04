const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  reactToVideo,
  removeReaction,
} = require("../controllers/like.controller");

// Like / Dislike
router.post(
  "/:id",
  authMiddleware,
  reactToVideo
);

// Remove Reaction
router.delete(
  "/:id",
  authMiddleware,
  removeReaction
);

module.exports = router;