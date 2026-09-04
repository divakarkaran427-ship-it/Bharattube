const mongoose = require("mongoose");

const copyrightStrikeSchema = new mongoose.Schema(
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

    takedown: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CopyrightTakedown",
      default: null,
      index: true,
    },

    struckUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    struckChannel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
      index: true,
    },

    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    issuedByRole: {
      type: String,
      enum: ["admin", "moderator", "system"],
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    decision: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "appealed", "reversed", "expired"],
      default: "active",
      index: true,
    },

    strikeLevel: {
      type: String,
      enum: ["1", "2", "3"],
      default: "1",
      index: true,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    appealedAt: {
      type: Date,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

copyrightStrikeSchema.index({ struckUser: 1, status: 1, issuedAt: -1 });
copyrightStrikeSchema.index({ struckChannel: 1, status: 1, issuedAt: -1 });
copyrightStrikeSchema.index({ video: 1, status: 1 });

module.exports = mongoose.model("CopyrightStrike", copyrightStrikeSchema);
