const mongoose = require("mongoose");

const videoImpressionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    sessionId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
    },

    surface: {
      type: String,
      enum: ["home", "related", "search", "channel", "shorts"],
      required: true,
      index: true,
    },

    position: {
      type: Number,
      required: true,
      min: 0,
    },

    clickedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

videoImpressionSchema.index({ video: 1, createdAt: -1 });
videoImpressionSchema.index({ user: 1, surface: 1, createdAt: -1 });
videoImpressionSchema.index({ sessionId: 1, surface: 1, createdAt: -1 });

module.exports = mongoose.model("VideoImpression", videoImpressionSchema);
