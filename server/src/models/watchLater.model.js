const mongoose = require("mongoose");

const watchLaterSchema = new mongoose.Schema(
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

    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

watchLaterSchema.index({ user: 1, video: 1 }, { unique: true });
watchLaterSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("WatchLater", watchLaterSchema);
