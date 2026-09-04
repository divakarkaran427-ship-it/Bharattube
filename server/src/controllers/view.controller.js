const Video = require("../models/video.model");
const ApiResponse = require("../utils/ApiResponse");

// ==========================
// Add View
// ==========================
const addView = async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId).select("views title");

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const response = new ApiResponse(
      200,
      "View counting is verified through genuine watch activity.",
      {
        views: video.views,
        viewCounted: false,
      }
    );

    // Keep the legacy top-level `views` field so existing clients remain compatible.
    response.views = video.views;
    response.viewCounted = false;

    return res.status(200).json(response);

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// Get Video Views
// ==========================
const getVideoViews = async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId).select("views title");

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    return res.status(200).json({
      success: true,
      title: video.title,
      views: video.views,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addView,
  getVideoViews,
};
