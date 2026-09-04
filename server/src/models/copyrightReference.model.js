const mongoose = require("mongoose");

const copyrightReferenceSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      default: null,
      index: true,
    },

    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      default: null,
      index: true,
    },

    ownerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    sourceType: {
      type: String,
      enum: ["original", "user_submission", "external_url", "manual_entry"],
      default: "manual_entry",
    },

    sourceUrl: {
      type: String,
      default: "",
      trim: true,
    },

    sourceDescription: {
      type: String,
      default: "",
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "archived", "rejected"],
      default: "active",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

copyrightReferenceSchema.index({ video: 1, status: 1, createdAt: -1 });
copyrightReferenceSchema.index({ channel: 1, ownerUser: 1, status: 1 });
copyrightReferenceSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model("CopyrightReference", copyrightReferenceSchema);
