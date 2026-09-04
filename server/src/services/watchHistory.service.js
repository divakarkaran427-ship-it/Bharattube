const WatchHistory = require("../models/watchHistory.model");
const Video = require("../models/video.model");

const COMPLETION_THRESHOLD = 95;

const toNonNegativeNumber = (value) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const upsertWatchProgress = async ({ userId, videoId, currentTime, duration, completed }) => {
  const safeDuration = toNonNegativeNumber(duration);
  const safeCurrentTime = safeDuration > 0
    ? Math.min(toNonNegativeNumber(currentTime), safeDuration)
    : toNonNegativeNumber(currentTime);
  const completionPercentage = safeDuration > 0
    ? Math.min((safeCurrentTime / safeDuration) * 100, 100)
    : 0;
  const isCompleted = Boolean(completed) || completionPercentage >= COMPLETION_THRESHOLD;
  const watchedAt = new Date();

  return WatchHistory.findOneAndUpdate(
    { user: userId, video: videoId },
    [
      {
        $set: {
          user: userId,
          video: videoId,
          currentTime: safeCurrentTime,
          duration: safeDuration,
          completionPercentage,
          watchedDuration: {
            $max: [{ $ifNull: ["$watchedDuration", 0] }, safeCurrentTime],
          },
          completed: {
            $or: [{ $ifNull: ["$completed", false] }, isCompleted],
          },
          lastWatchedAt: watchedAt,
          watchedAt,
        },
      },
    ],
    {
      new: true,
      upsert: true,
      timestamps: true,
    }
  );
};

const getHistory = async ({ userId, page = 1, limit = 20, search = "" }) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const query = { user: userId };

  if (search.trim()) {
    const matchingVideos = await Video.find({
      title: { $regex: escapeRegex(search.trim()), $options: "i" },
    }).select("_id").lean();

    query.video = { $in: matchingVideos.map((video) => video._id) };
  }

  const historyQuery = WatchHistory.find(query)
    .populate("video")
    .sort({ lastWatchedAt: -1 })
    .skip((safePage - 1) * safeLimit)
    .limit(safeLimit);

  const [history, total] = await Promise.all([
    historyQuery,
    WatchHistory.countDocuments(query),
  ]);

  return {
    history: history.filter((entry) => entry.video),
    page: safePage,
    limit: safeLimit,
    total,
  };
};

const getContinueWatching = async ({ userId, limit = 12 }) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);

  return WatchHistory.find({
    user: userId,
    completed: false,
    completionPercentage: { $lt: COMPLETION_THRESHOLD },
  })
    .populate("video")
    .sort({ lastWatchedAt: -1 })
    .limit(safeLimit);
};

const removeHistoryItem = ({ userId, videoId }) => WatchHistory.deleteOne({
  user: userId,
  video: videoId,
});

const clearHistory = ({ userId }) => WatchHistory.deleteMany({ user: userId });

module.exports = {
  COMPLETION_THRESHOLD,
  clearHistory,
  getContinueWatching,
  getHistory,
  removeHistoryItem,
  upsertWatchProgress,
};
