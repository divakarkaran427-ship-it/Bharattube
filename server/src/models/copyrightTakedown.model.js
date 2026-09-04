const mongoose = require("mongoose");

const copyrightTakedownSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
    },

    claim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CopyrightClaim",
      default: null,
      index: true,
    },

    dispute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CopyrightDispute",
      default: null,
      index: true,
    },

    requesterUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    requesterChannel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      default: null,
      index: true,
    },

    requestedBy: {
      type: String,
      enum: ["rights_owner", "authorized_representative", "admin"],
      default: "rights_owner",
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
      enum: ["pending", "approved", "rejected", "expired"],
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

    decisionReason: {
      type: String,
      default: "",
      trim: true,
    },

    targetAction: {
      type: String,
      enum: ["hide_video", "remove_video", "restrict_access", "none"],
      default: "hide_video",
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

copyrightTakedownSchema.index({ video: 1, status: 1, submittedAt: -1 });
copyrightTakedownSchema.index({ requesterUser: 1, status: 1, submittedAt: -1 });
copyrightTakedownSchema.index({ claim: 1, status: 1 });

module.exports = mongoose.model("CopyrightTakedown", copyrightTakedownSchema);
