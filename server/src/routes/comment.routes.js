const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  addComment,
  getComments,
  toggleCommentLike,
  removeCommentLike,
} = require("../controllers/comment.controller");

// ==========================
// Add Comment
// POST /api/v1/comments/:id
// ==========================
router.post("/:id", authMiddleware, addComment);

// ==========================
// Toggle comment like
// POST /api/v1/comments/:commentId/like
// ==========================
router.post("/:commentId/like", authMiddleware, toggleCommentLike);

// ==========================
// Remove comment like
// DELETE /api/v1/comments/:commentId/like
// ==========================
router.delete("/:commentId/like", authMiddleware, removeCommentLike);

// ==========================
// Get All Comments
// GET /api/v1/comments/:id
// ==========================
router.get("/:id", getComments);

module.exports = router;