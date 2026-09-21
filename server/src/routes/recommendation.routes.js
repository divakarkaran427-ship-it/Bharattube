const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const optionalAuth = require("../middlewares/optionalAuth.middleware");

const {
  getHomeFeed,
  getSimilarVideos,
  getTrendingVideos,
  getPersonalizedRecommendations,
} = require("../controllers/recommendation.controller");
const {
  recordClick,
  recordImpressions,
} = require("../controllers/recommendationEvent.controller");

// ==========================
// Home Feed
// ==========================
router.get("/home", getHomeFeed);

// ==========================
// Similar Videos
// ==========================
router.get("/similar/:videoId", getSimilarVideos);

// ==========================
// Trending Videos
// ==========================
router.get("/trending", getTrendingVideos);

// ==========================
// Personalized Recommendations
// ==========================
router.get(
  "/personalized",
  authMiddleware,
  getPersonalizedRecommendations
);

// =========================
// CTR Event Tracking
// =========================
router.post("/impressions", optionalAuth, recordImpressions);
router.post("/clicks", optionalAuth, recordClick);

module.exports = router;
