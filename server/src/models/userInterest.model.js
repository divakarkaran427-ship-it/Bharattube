const mongoose = require("mongoose");

const userInterestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    categoryScores: {
      type: Map,
      of: Number,
      default: {},
    },

    tagScores: {
      type: Map,
      of: Number,
      default: {},
    },

    channelScores: {
      type: Map,
      of: Number,
      default: {},
    },

    lastCalculatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserInterest", userInterestSchema);
