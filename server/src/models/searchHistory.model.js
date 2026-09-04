const mongoose = require("mongoose");

const searchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    query: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },

    clickedVideo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      default: null,
    },

    clickedChannel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

searchHistorySchema.index({ user: 1, createdAt: -1 });
searchHistorySchema.index({ query: 1, createdAt: -1 });

module.exports = mongoose.model("SearchHistory", searchHistorySchema);
