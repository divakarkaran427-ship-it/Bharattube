const mongoose = require("mongoose");

const watchSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
    },

    sessionStartedAt: {
      type: Date,
      default: Date.now,
    },

    lastSeenAt: {
      type: Date,
      default: Date.now,
    },

    currentTime: {
      type: Number,
      default: 0,
      min: 0,
    },

    watchedSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    duration: {
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

    viewCounted: {
      type: Boolean,
      default: false,
    },

    isGuest: {
      type: Boolean,
      default: false,
    },

    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

watchSchema.index({ user: 1, video: 1, sessionStartedAt: -1 });
watchSchema.index({ video: 1, lastSeenAt: -1 });
watchSchema.index({ user: 1, viewCounted: 1, lastSeenAt: -1 });

module.exports = mongoose.model("Watch", watchSchema);
