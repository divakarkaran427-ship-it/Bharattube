const Video = require("../models/video.model");

const getLikedVideos = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const [videos, total] = await Promise.all([
      Video.find({ likes: req.user._id, visibility: "public" })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: "channel",
          select: "channelName handle logo",
        })
        .lean(),
      Video.countDocuments({ likes: req.user._id, visibility: "public" }),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
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
  getLikedVideos,
};
