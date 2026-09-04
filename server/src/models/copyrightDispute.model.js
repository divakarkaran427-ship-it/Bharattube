const mongoose = require("mongoose");

const copyrightDisputeSchema = new mongoose.Schema(
  {
    claim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CopyrightClaim",
      required: true,
      index: true,
    },

    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
    },

    uploaderUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    uploaderChannel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
      index: true,
    },

    reason: {
      type: String,
      default: "",
      trim: true,
    },

    evidence: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["open", "under_review", "resolved", "rejected"],
      default: "open",
      index: true,
    },

    resolution: {
      type: String,
      default: "",
      trim: true,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

copyrightDisputeSchema.index({ claim: 1, status: 1, createdAt: -1 });
copyrightDisputeSchema.index({ video: 1, status: 1, createdAt: -1 });
copyrightDisputeSchema.index({ uploaderUser: 1, status: 1 });

module.exports = mongoose.model("CopyrightDispute", copyrightDisputeSchema);
