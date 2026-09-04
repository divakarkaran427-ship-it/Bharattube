const Video = require("../models/video.model");
const Comment = require("../models/comment.model");
const { getPersonalizedFeed } = require("../services/recommendation.service");
// ==========================
// Home Feed
// ==========================
const getHomeFeed = async (req, res) => {
  try {
    const videos = await Video.find({
      visibility: "public",
      isPublished: true,
    })
      .populate("channel", "channelName logo")
      .sort({
        views: -1,
        createdAt: -1,
      })
      .limit(20);

    return res.status(200).json({
      success: true,
      total: videos.length,
      videos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// Similar Videos
// ==========================
const getSimilarVideos = async (req, res) => {
  try {
    const { videoId } = req.params;

    const currentVideo = await Video.findById(videoId);

    if (!currentVideo) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const videos = await Video.find({
      _id: { $ne: currentVideo._id },
      visibility: "public",
      isPublished: true,
      category: currentVideo.category,
    })
      .populate("channel", "channelName logo")
      .sort({
        views: -1,
        createdAt: -1,
      })
      .limit(15);

    return res.status(200).json({
      success: true,
      total: videos.length,
      videos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// Trending Videos
// ==========================
const getTrendingVideos = async (req, res) => {
  try {
    const videos = await Video.find({
      visibility: "public",
      isPublished: true,
    }).populate("channel", "channelName logo");

    const trendingVideos = await Promise.all(
      videos.map(async (video) => {
        const commentsCount = await Comment.countDocuments({
          video: video._id,
        });

        const likesCount = video.likes ? video.likes.length : 0;

        // Trending Score
        const score =
          (video.views * 0.5) +
          (likesCount * 10) +
          (commentsCount * 5);

        return {
          ...video.toObject(),
          likesCount,
          commentsCount,
          trendingScore: score,
        };
      })
    );

    trendingVideos.sort(
      (a, b) => b.trendingScore - a.trendingScore
    );

    return res.status(200).json({
      success: true,
      total: trendingVideos.length,
      videos: trendingVideos,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================
// Personalized Recommendations
// ==========================
const getPersonalizedRecommendations = async (req, res) => {
  try {
    const videos = await getPersonalizedFeed({
      userId: req.user._id,
      limit: req.query.limit,
    });

    return res.status(200).json({
      success: true,
      type: "personalized",
      total: videos.length,
      videos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getHomeFeed,
  getSimilarVideos,
  getTrendingVideos,
  getPersonalizedRecommendations,
};
