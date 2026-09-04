const Video = require("../models/video.model");
const User = require("../models/user.model");
const WatchHistory = require("../models/watchHistory.model");

const COMPLETION_THRESHOLD = 80;

const toNonNegativeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeWatchPayload = ({ currentTime, watchedSeconds, duration, completionPercentage, videoDuration }) => {
  const safeCurrentTime = Math.max(
    toNonNegativeNumber(currentTime),
    toNonNegativeNumber(watchedSeconds)
  );

  const safeDuration = Math.max(toNonNegativeNumber(duration), toNonNegativeNumber(videoDuration));
  const safeCompletion = clamp(toNonNegativeNumber(completionPercentage), 0, 100);

  return {
    currentTime: safeDuration > 0 ? Math.min(safeCurrentTime, safeDuration) : safeCurrentTime,
    duration: safeDuration,
    completionPercentage: safeDuration > 0
      ? Math.round((safeCurrentTime / safeDuration) * 100)
      : safeCompletion,
  };
};

const startWatchingSession = async (req, res) => {
  try {
    const { id: videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({ success: false, message: "Video id is required." });
    }

    const video = await Video.findById(videoId).select("_id duration title views");
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found." });
    }

    if (req.user?._id) {
      const existingUser = await User.findById(req.user._id).select("_id");
      if (!existingUser) {
        return res.status(401).json({ success: false, message: "User not found." });
      }

      const history = await WatchHistory.findOneAndUpdate(
        { user: req.user._id, video: videoId },
        {
          $setOnInsert: {
            user: req.user._id,
            video: videoId,
          },
          $set: {
            duration: video.duration || 0,
            currentTime: 0,
            watchedDuration: 0,
            completionPercentage: 0,
            completed: false,
            lastWatchedAt: new Date(),
            watchedAt: new Date(),
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

      return res.status(200).json({
        success: true,
        message: "Watch session started.",
        guest: false,
        watchHistory: {
          id: history._id,
          video: history.video,
          user: history.user,
          currentTime: history.currentTime,
          watchedDuration: history.watchedDuration,
          completionPercentage: history.completionPercentage,
          duration: history.duration,
          completed: history.completed,
          lastWatchedAt: history.lastWatchedAt,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Guest watch session started.",
      guest: true,
      watchHistory: null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to start watch session." });
  }
};

const saveWatchProgress = async (req, res) => {
  try {
    const { id: videoId } = req.params;
    const { currentTime, watchedSeconds, duration, completionPercentage } = req.body || {};

    if (!videoId) {
      return res.status(400).json({ success: false, message: "Video id is required." });
    }

    const video = await Video.findById(videoId).select("_id duration title views");
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found." });
    }

    const normalized = normalizeWatchPayload({
      currentTime,
      watchedSeconds,
      duration,
      completionPercentage,
      videoDuration: video.duration,
    });

    if (normalized.duration > 0 && normalized.currentTime > normalized.duration) {
      return res.status(400).json({ success: false, message: "Current time cannot exceed video duration." });
    }

    if (!req.user?._id) {
      return res.status(200).json({
        success: true,
        message: "Guest watch progress saved for the current session.",
        guest: true,
        watchHistory: {
          currentTime: normalized.currentTime,
          duration: normalized.duration,
          completionPercentage: normalized.completionPercentage,
          completed: false,
          viewCounted: false,
          reason: "Guest users are not persisted in the existing watch history model.",
        },
      });
    }

    const existingUser = await User.findById(req.user._id).select("_id");
    if (!existingUser) {
      return res.status(401).json({ success: false, message: "User not found." });
    }

    const history = await WatchHistory.findOne({ user: req.user._id, video: videoId });
    const now = new Date();

    const safeHistory = history || new WatchHistory({ user: req.user._id, video: videoId });
    const lastWatchedAt = safeHistory.lastWatchedAt;
    const previousProgress = toNonNegativeNumber(safeHistory.currentTime || 0);
    const previousCompletion = toNonNegativeNumber(safeHistory.completionPercentage || 0);
    const previousWatchedDuration = toNonNegativeNumber(safeHistory.watchedDuration || 0);
    const isSpamRefresh = lastWatchedAt && (now.getTime() - lastWatchedAt.getTime()) < 2000 && Math.abs(normalized.currentTime - previousProgress) < 2;

    if (isSpamRefresh) {
      return res.status(200).json({
        success: true,
        message: "Refresh spam ignored.",
        guest: false,
        watchHistory: {
          currentTime: previousProgress,
          watchedDuration: previousWatchedDuration,
          completionPercentage: previousCompletion,
          duration: normalized.duration || safeHistory.duration || 0,
          completed: Boolean(safeHistory.completed),
          viewCounted: false,
          reason: "Duplicate progress update ignored.",
        },
      });
    }

    safeHistory.currentTime = normalized.currentTime;
    safeHistory.duration = normalized.duration || safeHistory.duration || 0;
    safeHistory.watchedDuration = Math.max(previousWatchedDuration, normalized.currentTime);
    safeHistory.completionPercentage = Math.max(previousCompletion, normalized.completionPercentage);
    safeHistory.lastWatchedAt = now;
    safeHistory.watchedAt = safeHistory.watchedAt || now;

    const hasEnoughCompletion = safeHistory.completionPercentage >= COMPLETION_THRESHOLD;
    safeHistory.completed = Boolean(safeHistory.completed) || hasEnoughCompletion;

    await safeHistory.save();

    return res.status(200).json({
      success: true,
      message: "Watch progress saved successfully.",
      guest: false,
      watchHistory: {
        currentTime: safeHistory.currentTime,
        watchedDuration: safeHistory.watchedDuration,
        completionPercentage: safeHistory.completionPercentage,
        duration: safeHistory.duration,
        completed: Boolean(safeHistory.completed),
        viewCounted: false,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to save watch progress." });
  }
};

const saveWatchedSeconds = async (req, res) => {
  try {
    const { id: videoId } = req.params;
    const { watchedSeconds = 0, duration } = req.body || {};

    if (!videoId) {
      return res.status(400).json({ success: false, message: "Video id is required." });
    }

    const video = await Video.findById(videoId).select("_id duration");
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found." });
    }

    const normalized = normalizeWatchPayload({
      currentTime: watchedSeconds,
      watchedSeconds,
      duration,
      completionPercentage: 0,
      videoDuration: video.duration,
    });

    if (!req.user?._id) {
      return res.status(200).json({
        success: true,
        message: "Guest watched seconds captured.",
        guest: true,
        watchedSeconds: normalized.currentTime,
      });
    }

    const history = await WatchHistory.findOne({ user: req.user._id, video: videoId });
    const safeHistory = history || new WatchHistory({ user: req.user._id, video: videoId });

    safeHistory.currentTime = normalized.currentTime;
    safeHistory.duration = normalized.duration || safeHistory.duration || 0;
    safeHistory.watchedDuration = Math.max(toNonNegativeNumber(safeHistory.watchedDuration || 0), normalized.currentTime);
    safeHistory.lastWatchedAt = new Date();

    await safeHistory.save();

    return res.status(200).json({
      success: true,
      message: "Watched seconds saved successfully.",
      guest: false,
      watchedSeconds: safeHistory.watchedDuration,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to save watched seconds." });
  }
};

const saveCompletionPercentage = async (req, res) => {
  try {
    const { id: videoId } = req.params;
    const { completionPercentage = 0, currentTime = 0, duration } = req.body || {};

    if (!videoId) {
      return res.status(400).json({ success: false, message: "Video id is required." });
    }

    const video = await Video.findById(videoId).select("_id duration");
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found." });
    }

    const normalized = normalizeWatchPayload({
      currentTime,
      watchedSeconds: currentTime,
      duration,
      completionPercentage,
      videoDuration: video.duration,
    });

    if (!req.user?._id) {
      return res.status(200).json({
        success: true,
        message: "Guest completion percentage captured.",
        guest: true,
        completionPercentage: normalized.completionPercentage,
      });
    }

    const history = await WatchHistory.findOne({ user: req.user._id, video: videoId });
    const safeHistory = history || new WatchHistory({ user: req.user._id, video: videoId });

    safeHistory.currentTime = normalized.currentTime;
    safeHistory.duration = normalized.duration || safeHistory.duration || 0;
    safeHistory.completionPercentage = Math.max(
      toNonNegativeNumber(safeHistory.completionPercentage || 0),
      normalized.completionPercentage
    );
    safeHistory.lastWatchedAt = new Date();

    await safeHistory.save();

    return res.status(200).json({
      success: true,
      message: "Completion percentage saved successfully.",
      guest: false,
      completionPercentage: safeHistory.completionPercentage,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to save completion percentage." });
  }
};

module.exports = {
  startWatchingSession,
  saveWatchProgress,
  saveWatchedSeconds,
  saveCompletionPercentage,
};
