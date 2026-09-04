const Video = require("../models/video.model");
const { creditEarning } = require("../services/earning.service");

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const Settings = require("../models/settings.model");
// ==========================================
// Credit Video Earning
// ==========================================

const creditVideoEarning = asyncHandler(async (req, res) => {
  const { videoId, views } = req.body;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required.");
  }

  if (!views || views <= 0) {
    throw new ApiError(400, "Valid views are required.");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found.");
  }

  // Test RPM (₹100 per 1000 views)
const settings = await Settings.findOne();

if (!settings) {
    throw new ApiError(500, "Platform settings not found.");
}

if (!settings.monetizationEnabled) {
    throw new ApiError(403, "Monetization is disabled.");
}

const rpm = settings.videoRPM; 


  const amount = Number(((views / 1000) * rpm).toFixed(2));

  const earning = await creditEarning({
    creatorId: video.owner,
    source: "video",
    sourceId: video._id,
    amount,
    views,
    rpm,
    description: `Video monetization (${views} views)`,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      earning,
      "Video earning credited successfully."
    )
  );
});

module.exports = {
  creditVideoEarning,
};