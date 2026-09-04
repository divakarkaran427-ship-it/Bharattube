const Channel = require("../models/channel.model");
const Video = require("../models/video.model");
const Comment = require("../models/comment.model");

// ==========================
// Creator Dashboard
// ==========================

const getDashboard = async (req, res) => {
  try {
    const channel = await Channel.findOne({
      owner: req.user._id,
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    const videos = await Video.find({
      channel: channel._id,
    });

    const totalVideos = videos.filter(
      (video) => !video.isShort
    ).length;

    const totalShorts = videos.filter(
      (video) => video.isShort
    ).length;

    const totalViews = videos.reduce(
      (sum, video) => sum + video.views,
      0
    );

    const totalLikes = videos.reduce(
      (sum, video) => sum + video.likes.length,
      0
    );

    const videoIds = videos.map((video) => video._id);

    const totalComments = await Comment.countDocuments({
      video: {
        $in: videoIds,
      },
    });

    return res.status(200).json({
      success: true,
      dashboard: {
        channelName: channel.channelName,
        handle: channel.handle,
        subscribers: channel.subscribers.length,
        totalVideos,
        totalShorts,
        totalViews,
        totalLikes,
        totalComments,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================
// My Studio Videos
// ==========================

const getStudioVideos = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      visibility,
      type,
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const channel = await Channel.findOne({
      owner: req.user._id,
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    const filter = {
      channel: channel._id,
    };

    if (search) {
      filter.title = {
        $regex: search,
        $options: "i",
      };
    }

    if (visibility) {
      filter.visibility = visibility;
    }

    if (type === "video") {
      filter.isShort = false;
    }

    if (type === "short") {
      filter.isShort = true;
    }

    const totalVideos = await Video.countDocuments(filter);

    const videos = await Video.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        "title thumbnail views visibility likes commentsCount isShort createdAt"
      );

    return res.status(200).json({
      success: true,

      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalVideos / limit),
        totalVideos,
        hasNextPage: page * limit < totalVideos,
        hasPrevPage: page > 1,
      },

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
  getDashboard,
  getStudioVideos,
};