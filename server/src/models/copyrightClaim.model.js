const mongoose = require("mongoose");

const copyrightClaimSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
    },

    claimantUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    claimantChannel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      default: null,
      index: true,
    },

    reference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CopyrightReference",
      default: null,
      index: true,
    },

    claimType: {
      type: String,
      enum: ["manual", "automated", "user_report"],
      default: "manual",
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    evidence: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "under_review", "valid", "rejected", "withdrawn"],
      default: "pending",
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    reviewNotes: {
      type: String,
      default: "",
      trim: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
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

copyrightClaimSchema.index({ video: 1, status: 1, submittedAt: -1 });
copyrightClaimSchema.index({ claimantUser: 1, status: 1, submittedAt: -1 });
copyrightClaimSchema.index({ reference: 1, status: 1 });

module.exports = mongoose.model("CopyrightClaim", copyrightClaimSchema);
