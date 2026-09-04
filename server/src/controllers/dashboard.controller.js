const Video = require("../models/video.model");
const Channel = require("../models/channel.model");
const Comment = require("../models/comment.model");

// ==========================
// Get Creator Dashboard
// ==========================
const getDashboard = async (req, res) => {
  try {
    // Find creator channel
    const channel = await Channel.findOne({ owner: req.user._id });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // Get all creator videos
   const videos = await Video.find({
  channel: channel._id,
});

    const totalVideos = videos.length;

    // Total Views
    const totalViews = videos.reduce(
      (sum, video) => sum + (video.views || 0),
      0
    );

    // Total Likes
    const totalLikes = videos.reduce(
      (sum, video) => sum + (video.likes?.length || 0),
      0
    );

    // Total Comments
    const videoIds = videos.map((video) => video._id);

    const totalComments = await Comment.countDocuments({
      video: { $in: videoIds },
    });

    // Top 5 Videos
    const topVideos = [...videos]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((video) => ({
        id: video._id,
        title: video.title,
        thumbnail: video.thumbnail,
        views: video.views,
        likes: video.likes.length,
      }));

    return res.status(200).json({
      success: true,
      dashboard: {
        channelName: channel.channelName,
        subscribers: channel.subscribers.length,
        totalVideos,
        totalViews,
        totalLikes,
        totalComments,
        topVideos,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDashboard,
};