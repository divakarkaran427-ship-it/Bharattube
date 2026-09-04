const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  getMyNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  deleteNotification,
} = require("../controllers/notification.controller");

// Get My Notifications
router.get("/", authMiddleware, getMyNotifications);
router.get("/unread-count", authMiddleware, getUnreadCount);
router.patch("/read-all", authMiddleware, markAllAsRead);

// Mark As Read
router.patch("/:id", authMiddleware, markAsRead);

// Delete Notification
router.delete("/:id", authMiddleware, deleteNotification);

module.exports = router;
