const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const upload = require("../middlewares/upload.middleware");
const {
  createChannelValidator,
  updateChannelValidator,
} = require("../validators/channel.validator");

const {
  createChannel,
  getMyChannel,
  updateChannel,
  deleteChannel,
  getChannelByHandle,
  getChannelVideos,
  updateChannelImages,
} = require("../controllers/channel.controller");

// ==========================
// Protected Routes
// ==========================

// Create Channel
router.post(
  "/",
  authMiddleware,
  createChannelValidator,
  validate,
  createChannel
);

// Get My Channel
router.get("/me", authMiddleware, getMyChannel);

// Update Channel
router.put(
  "/",
  authMiddleware,
  updateChannelValidator,
  validate,
  updateChannel
);

// Upload Channel Images
router.put(
  "/images",
  authMiddleware,
  upload.fields([
    {
      name: "logo",
      maxCount: 1,
    },
    {
      name: "banner",
      maxCount: 1,
    },
  ]),
  updateChannelImages
);

// Delete Channel
router.delete("/", authMiddleware, deleteChannel);

// ==========================
// Public Routes
// ==========================

// Get Channel By Handle
router.get("/:handle", getChannelByHandle);

// Get Channel Videos
router.get("/:handle/videos", getChannelVideos);

module.exports = router;