const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    thumbnail: {
      type: String,
      default: "",
    },

    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        index: true,
      },
    ],

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

playlistSchema.index({ owner: 1, createdAt: -1 });
playlistSchema.index({ visibility: 1, createdAt: -1 });
playlistSchema.index({ owner: 1, title: 1 });

module.exports = mongoose.model("Playlist", playlistSchema);