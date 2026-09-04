const Video = require("../models/video.model");

// ==========================
// Shorts Feed
// ==========================

const getShortsFeed = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = Number(page);
    limit = Number(limit);

    const filter = {
      isShort: true,
      isPublished: true,
      visibility: "public",
    };

    const totalShorts = await Video.countDocuments(filter);

    const shorts = await Video.find(filter)
      .populate({
        path: "channel",
        select: "channelName handle logo verified subscribers",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,

      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalShorts / limit),
        totalShorts,
        hasNextPage: page * limit < totalShorts,
        hasPrevPage: page > 1,
      },

      shorts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getShortsFeed,
};