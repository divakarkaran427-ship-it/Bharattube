const WatchLater = require("../models/watchLater.model");
const Video = require("../models/video.model");

const addToWatchLater = async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId).select("_id");
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const existing = await WatchLater.findOne({
      user: req.user._id,
      video: videoId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Video already exists in Watch Later",
      });
    }

    const watchLaterItem = await WatchLater.create({
      user: req.user._id,
      video: videoId,
    });

    const populatedItem = await WatchLater.findById(watchLaterItem._id)
      .populate({
        path: "video",
        select: "title thumbnail duration visibility channel description",
        populate: {
          path: "channel",
          select: "channelName handle logo",
        },
      })
      .lean();

    return res.status(201).json({
      success: true,
      message: "Video added to Watch Later",
      item: populatedItem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyWatchLater = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 24, 50);
    const page = Math.max(Number(req.query.page) || 1, 1);

    const [items, total] = await Promise.all([
      WatchLater.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: "video",
          select: "title thumbnail duration visibility channel description",
          populate: {
            path: "channel",
            select: "channelName handle logo",
          },
        })
        .lean(),
      WatchLater.countDocuments({ user: req.user._id }),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      items,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const removeFromWatchLater = async (req, res) => {
  try {
    const { videoId } = req.params;

    const deletedItem = await WatchLater.findOneAndDelete({
      user: req.user._id,
      video: videoId,
    });

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: "Video not found in Watch Later",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Video removed from Watch Later",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addToWatchLater,
  getMyWatchLater,
  removeFromWatchLater,
};
