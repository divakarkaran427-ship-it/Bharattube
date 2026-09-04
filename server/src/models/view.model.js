const mongoose = require("mongoose");

const viewSchema = new mongoose.Schema(
  {
    // The video whose playback produced this audit event.
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
    },

    // Present for authenticated viewers. Guests are identified by hashed signals only.
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // A server-generated key that represents either a user or a guest device.
    // It is hashed before storage, so raw IP addresses and fingerprints are never persisted.
    viewerKeyHash: {
      type: String,
      required: true,
      index: true,
    },

    ipHash: {
      type: String,
      required: true,
      index: true,
    },

    deviceHash: {
      type: String,
      required: true,
      index: true,
    },

    // Only the hash is stored; the signed token itself never reaches MongoDB.
    sessionTokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    watchedPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },

    isValid: {
      type: Boolean,
      default: false,
      index: true,
    },

    suspiciousReasons: {
      type: [String],
      default: [],
    },

    // Limited non-identifying telemetry retained for fraud investigations.
    deviceInfo: {
      userAgent: {
        type: String,
        default: "",
        maxlength: 512,
      },
      platform: {
        type: String,
        default: "",
        maxlength: 128,
      },
      language: {
        type: String,
        default: "",
        maxlength: 32,
      },
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    countedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Enforces the per-video cooldown lookup without permanently blocking future views.
viewSchema.index({ video: 1, viewerKeyHash: 1, createdAt: -1 });

// Lets the batch worker fetch verified-but-not-yet-counted events efficiently.
viewSchema.index({ status: 1, countedAt: 1, createdAt: 1 });

// Supports rolling per-IP anomaly checks without full collection scans.
viewSchema.index({ ipHash: 1, createdAt: -1 });

module.exports = mongoose.model("View", viewSchema);
