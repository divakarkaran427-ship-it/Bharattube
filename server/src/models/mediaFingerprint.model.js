const mongoose = require("mongoose");

const mediaFingerprintSchema = new mongoose.Schema(
  {
    video: {
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

    mediaType: {
      type: String,
      enum: ["audio", "video"],
      required: true,
      index: true,
    },

    fingerprintVersion: {
      type: String,
      required: true,
      trim: true,
      default: "v1",
    },

    hashSummary: {
      type: String,
      required: true,
      trim: true,
    },

    featureSignature: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

mediaFingerprintSchema.index({ video: 1, mediaType: 1, createdAt: -1 });
mediaFingerprintSchema.index({ reference: 1, mediaType: 1, createdAt: -1 });
mediaFingerprintSchema.index({ mediaType: 1, fingerprintVersion: 1, createdAt: -1 });

module.exports = mongoose.model("MediaFingerprint", mediaFingerprintSchema);
