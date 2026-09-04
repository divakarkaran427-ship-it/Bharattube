const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");
const validate = require("../middlewares/validation.middleware");

const {
  uploadVideoValidator,
  updateVideoValidator,
} = require("../validators/video.validator");

const {
  uploadVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  toggleVisibility,
} = require("../controllers/video.controller");

// ==========================
// Public Routes
// ==========================

// Home Feed
router.get("/", getAllVideos);

// Watch Video
router.get("/:id", getVideoById);

// ==========================
// Protected Routes
// ==========================

// Upload Video
router.post(
  "/",
  authMiddleware,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  uploadVideoValidator,
  validate,
  uploadVideo
);

// Update Video
router.put("/:id", authMiddleware, updateVideoValidator, validate, updateVideo);

// Delete Video
router.delete("/:id", authMiddleware, deleteVideo);

// Toggle Visibility
router.patch("/:id/visibility", authMiddleware, toggleVisibility);

module.exports = router;