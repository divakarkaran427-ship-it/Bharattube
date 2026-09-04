const mongoose = require("mongoose");

const matchResultSchema = new mongoose.Schema(
  {
    sourceVideo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
    },

    targetVideo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      default: null,
      index: true,
    },

    reference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CopyrightReference",
      default: null,
      index: true,
    },

    matchType: {
      type: String,
      enum: ["audio", "video", "mixed"],
      required: true,
      index: true,
    },

    score: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },

    timeOverlap: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "pending_review",
        "no_match",
        "potential_match",
        "reviewed_valid",
        "reviewed_rejected",
      ],
      default: "pending_review",
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    reviewDecision: {
      type: String,
      default: "",
      trim: true,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

matchResultSchema.index({ sourceVideo: 1, status: 1, createdAt: -1 });
matchResultSchema.index({ targetVideo: 1, status: 1, createdAt: -1 });
matchResultSchema.index({ reference: 1, status: 1, createdAt: -1 });
matchResultSchema.index({ score: -1, status: 1, createdAt: -1 });

module.exports = mongoose.model("MatchResult", matchResultSchema);
