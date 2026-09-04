const Video = require("../models/video.model");
const Channel = require("../models/channel.model");
const SearchHistory = require("../models/searchHistory.model");

const search = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const regex = new RegExp(q.trim(), "i");

    // Search Channels
    const channels = await Channel.find({
      $or: [
        { channelName: regex },
        { handle: regex }
      ]
    }).select("channelName handle logo subscribers");

    const channelIds = channels.map(channel => channel._id);

    // Search Videos
    const videos = await Video.find({
      visibility: "public",
      isPublished: true,
      $or: [
        { title: regex },
        { description: regex },
        { category: regex },
        { tags: regex },
        { channel: { $in: channelIds } }
      ]
    })
      .populate("channel", "channelName handle logo")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({
        views: -1,
        createdAt: -1,
      });

    const total = await Video.countDocuments({
      visibility: "public",
      isPublished: true,
      $or: [
        { title: regex },
        { description: regex },
        { category: regex },
        { tags: regex },
        { channel: { $in: channelIds } }
      ]
    });

    if (req.user) {
      try {
        await SearchHistory.create({
          user: req.user._id,
          query: q.trim(),
        });
      } catch (historyError) {
        console.error("Unable to record search history:", historyError.message);
      }
    }

    return res.status(200).json({
      success: true,
      query: q,
      totalVideos: total,
      totalChannels: channels.length,
      channels,
      videos,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

const recordSearchHistory = async (req, res) => {
  try {
    const { query, clickedVideo, clickedChannel } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const history = await SearchHistory.create({
      user: req.user._id,
      query: query.trim(),
      clickedVideo: clickedVideo || null,
      clickedChannel: clickedChannel || null,
    });

    return res.status(201).json({
      success: true,
      history,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  recordSearchHistory,
  search,
};
