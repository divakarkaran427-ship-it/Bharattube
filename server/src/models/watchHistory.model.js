const mongoose = require("mongoose");

const watchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
    },

    // Stored legacy field retained for existing watch and recommendation APIs.
    watchedDuration: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Stored legacy field retained for existing watch and recommendation APIs.
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Last resumable playback position, independent from total watch time.
    currentTime: {
      type: Number,
      default: 0,
      min: 0,
    },

    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    lastWatchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Canonical field names for new genuine-watch tracking code.
// Virtual aliases preserve existing controller and service contracts.
watchHistorySchema.virtual("watchTime")
  .get(function getWatchTime() {
    return this.watchedDuration;
  })
  .set(function setWatchTime(value) {
    this.watchedDuration = value;
  });

watchHistorySchema.virtual("videoDuration")
  .get(function getVideoDuration() {
    return this.duration;
  })
  .set(function setVideoDuration(value) {
    this.duration = value;
  });

watchHistorySchema.virtual("lastPosition")
  .get(function getLastPosition() {
    return this.currentTime;
  })
  .set(function setLastPosition(value) {
    this.currentTime = value;
  });

// Prevent impossible document states when a model instance is saved directly.
watchHistorySchema.pre("validate", function normalizeWatchProgress(next) {
  const safeDuration = Math.max(0, Number(this.duration) || 0);
  const safeWatchTime = Math.max(0, Number(this.watchedDuration) || 0);
  const safePosition = Math.max(0, Number(this.currentTime) || 0);

  this.duration = safeDuration;
  this.watchedDuration = safeDuration > 0 ? Math.min(safeWatchTime, safeDuration) : safeWatchTime;
  this.currentTime = safeDuration > 0 ? Math.min(safePosition, safeDuration) : safePosition;

  next();
});

// One resumable history record exists for each user/video pair.
watchHistorySchema.index({ user: 1, video: 1 }, { unique: true });

// Continue Watching and recently watched queries.
watchHistorySchema.index({ user: 1, completed: 1, lastWatchedAt: -1 });
watchHistorySchema.index({ user: 1, lastWatchedAt: -1 });

module.exports = mongoose.model("WatchHistory", watchHistorySchema);
