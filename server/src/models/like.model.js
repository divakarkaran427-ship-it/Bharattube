const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    targetType: {
      type: String,
      enum: ["video", "community", "comment", "short"],
      required: true,
      index: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    reaction: {
      type: String,
      enum: ["like", "dislike"],
      default: "like",
    },
  },
  {
    timestamps: true,
  }
);

// One reaction per user per target
likeSchema.index(
  {
    user: 1,
    targetType: 1,
    targetId: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Like", likeSchema);