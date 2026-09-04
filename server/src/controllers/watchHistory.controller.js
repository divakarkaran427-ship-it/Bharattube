const crypto = require("crypto");
const mongoose = require("mongoose");
const Video = require("../models/video.model");
const View = require("../models/view.model");
const WatchHistory = require("../models/watchHistory.model");
const UserInterest = require("../models/userInterest.model");
const { rebuildUserInterest } = require("../services/interestProfile.service");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const {
  clearHistory,
  getContinueWatching,
  getHistory,
  removeHistoryItem,
} = require("../services/watchHistory.service");

const INTEREST_REFRESH_INTERVAL = 5 * 60 * 1000;
const COMPLETION_THRESHOLD = 95;
const DEFAULT_GENUINE_VIEW_PERCENT = 34;
const DEFAULT_VIEW_COOLDOWN_MINUTES = 30;

const getConfiguredNumber = (environmentKey, fallbackValue, minimum, maximum) => {
  const value = Number(process.env[environmentKey]);

  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    return fallbackValue;
  }

  return value;
};

const GENUINE_VIEW_MIN_WATCH_PERCENT = getConfiguredNumber(
  "GENUINE_VIEW_MIN_WATCH_PERCENT",
  DEFAULT_GENUINE_VIEW_PERCENT,
  1,
  100
);
const GENUINE_VIEW_COOLDOWN_MINUTES = getConfiguredNumber(
  "GENUINE_VIEW_COOLDOWN_MINUTES",
  DEFAULT_VIEW_COOLDOWN_MINUTES,
  1,
  24 * 60
);

const hashValue = (value) => crypto
  .createHash("sha256")
  .update(`${process.env.VIEW_TRACKING_HASH_SALT || process.env.JWT_SECRET || "bharattube"}:${value}`)
  .digest("hex");

const toSafeProgressNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === "") return null;

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new ApiError(400, `${fieldName} must be a non-negative number`);
  }

  return parsedValue;
};

const refreshInterestProfileIfNeeded = async (userId) => {
  const profile = await UserInterest.findOne({ user: userId }).select("lastCalculatedAt").lean();
  const lastCalculatedAt = profile?.lastCalculatedAt?.getTime() || 0;

  if (Date.now() - lastCalculatedAt < INTEREST_REFRESH_INTERVAL) return;

  setImmediate(() => {
    rebuildUserInterest(userId).catch((error) => {
      console.error("Unable to refresh user interest profile:", error.message);
    });
  });
};

const registerGenuineView = async ({ history, req, video }) => {
  const videoDuration = Math.max(0, Number(video.duration) || 0);
  const watchTime = Math.min(Math.max(0, Number(history.watchedDuration) || 0), videoDuration);

  if (!videoDuration || !watchTime) {
    return { counted: false, reason: "insufficient-watch-data" };
  }

  const watchedPercentage = Math.min((watchTime / videoDuration) * 100, 100);

  if (watchedPercentage < GENUINE_VIEW_MIN_WATCH_PERCENT) {
    return { counted: false, reason: "watch-threshold-not-met" };
  }

  const now = new Date();
  const cooldownStart = new Date(
    now.getTime() - (GENUINE_VIEW_COOLDOWN_MINUTES * 60 * 1000)
  );
  const viewerId = req.user._id.toString();
  const clientIp = req.ip || req.socket?.remoteAddress || "unknown";
  const userAgent = req.get("user-agent") || "";
  const platform = req.get("sec-ch-ua-platform") || "";
  const language = req.get("accept-language") || "";
  const viewerKeyHash = hashValue(`user:${viewerId}`);
  const ipHash = hashValue(`ip:${clientIp}`);
  const deviceHash = hashValue(`device:${userAgent}:${platform}:${language}`);

  // The server derives this session key. The client cannot choose or reuse it.
  const sessionBucket = Math.floor(now.getTime() / (GENUINE_VIEW_COOLDOWN_MINUTES * 60 * 1000));
  const sessionTokenHash = hashValue(`session:${viewerKeyHash}:${video._id}:${sessionBucket}`);

  const recentlyCounted = await View.exists({
    video: video._id,
    viewer: req.user._id,
    status: "verified",
    createdAt: { $gte: cooldownStart },
  });

  if (recentlyCounted) {
    return { counted: false, reason: "cooldown-active" };
  }

  let auditLog;

  try {
    // `sessionTokenHash` has a unique index, making concurrent duplicate attempts safe.
    auditLog = await View.create({
      video: video._id,
      viewer: req.user._id,
      viewerKeyHash,
      ipHash,
      deviceHash,
      sessionTokenHash,
      watchedPercentage,
      status: "verified",
      isValid: true,
      verifiedAt: now,
      deviceInfo: {
        userAgent,
        platform,
        language,
      },
    });
  } catch (error) {
    const isSessionTokenDuplicate = error?.code === 11000 && (
      error?.keyPattern?.sessionTokenHash === 1
      || error?.message?.includes("sessionTokenHash_1")
    );

    if (isSessionTokenDuplicate) {
      return { counted: false, reason: "duplicate-session" };
    }

    if (error?.code === 11000) {
      throw new ApiError(
        503,
        "View verification is temporarily unavailable. Please try again later."
      );
    }

    throw error;
  }

  // Only the process that created the unique audit record can increment the denormalized counter.
  const incrementResult = await Video.updateOne(
    { _id: video._id },
    { $inc: { views: 1 } }
  );

  if (incrementResult.modifiedCount !== 1) {
    return { counted: false, reason: "counter-update-failed" };
  }

  auditLog.countedAt = now;
  await auditLog.save();

  return { counted: true, watchedPercentage };
};

const addToHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.user?._id) {
    throw new ApiError(401, "Authentication is required to save watch progress");
  }

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(id).select("_id duration").lean();

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Canonical payload names are accepted while legacy player payloads remain supported.
  const requestedWatchTime = toSafeProgressNumber(
    req.body.watchTime ?? req.body.watchedDuration,
    "watchTime"
  ) ?? 0;
  const requestedLastPosition = toSafeProgressNumber(
    req.body.lastPosition ?? req.body.currentTime,
    "lastPosition"
  ) ?? requestedWatchTime;
  const requestedDuration = toSafeProgressNumber(
    req.body.videoDuration ?? req.body.duration,
    "videoDuration"
  );
  const storedVideoDuration = Math.max(0, Number(video.duration) || 0);
  const videoDuration = storedVideoDuration || requestedDuration || 0;

  if (videoDuration <= 0) {
    throw new ApiError(400, "Video duration is not available yet");
  }

  if (requestedWatchTime > videoDuration || requestedLastPosition > videoDuration) {
    throw new ApiError(400, "Watch progress cannot exceed the video duration");
  }

  // Atomic upsert keeps exactly one resumable record for the authenticated user/video pair.
  let history = await WatchHistory.findOneAndUpdate(
    { user: req.user._id, video: video._id },
    {
      $setOnInsert: {
        user: req.user._id,
        video: video._id,
      },
      $set: {
        currentTime: requestedLastPosition,
        duration: videoDuration,
        lastWatchedAt: new Date(),
      },
      $max: {
        watchedDuration: requestedWatchTime,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  const watchTime = Math.min(history.watchedDuration, videoDuration);
  const completionPercentage = Math.min((watchTime / videoDuration) * 100, 100);

  history.watchedDuration = watchTime;
  history.completionPercentage = completionPercentage;
  history.completed = history.completed || completionPercentage >= COMPLETION_THRESHOLD;
  history.lastWatchedAt = new Date();
  history = await history.save();

  const viewDecision = await registerGenuineView({ history, req, video });

  refreshInterestProfileIfNeeded(req.user._id).catch((error) => {
    console.error("Unable to schedule user interest refresh:", error.message);
  });

  // `history` at root preserves the current frontend service contract.
  const response = new ApiResponse(200, "Watch progress updated successfully", {
    history,
    viewCounted: viewDecision.counted,
  });
  response.history = history;
  response.viewCounted = viewDecision.counted;

  return res.status(200).json(response);
});

const getMyHistory = async (req, res) => {
  try {
    const result = await getHistory({
      userId: req.user._id,
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
    });

    return res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      limit: result.limit,
      history: result.history,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyContinueWatching = async (req, res) => {
  try {
    const history = await getContinueWatching({
      userId: req.user._id,
      limit: req.query.limit,
    });

    return res.status(200).json({
      success: true,
      total: history.length,
      history,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteHistoryItem = async (req, res) => {
  try {
    const result = await removeHistoryItem({
      userId: req.user._id,
      videoId: req.params.videoId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "History item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "History item removed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const clearMyHistory = async (req, res) => {
  try {
    const result = await clearHistory({ userId: req.user._id });

    return res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: "Watch history cleared successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addToHistory,
  clearMyHistory,
  deleteHistoryItem,
  getMyContinueWatching,
  getMyHistory,
};
