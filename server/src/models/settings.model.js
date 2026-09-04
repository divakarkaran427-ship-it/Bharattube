const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    videoRPM: {
      type: Number,
      default: 100,
      min: 0,
    },

    shortsRPM: {
      type: Number,
      default: 40,
      min: 0,
    },

    minimumWithdraw: {
      type: Number,
      default: 1000,
      min: 100,
    },

    creatorRevenueShare: {
      type: Number,
      default: 55,
      min: 0,
      max: 100,
    },

    platformRevenueShare: {
      type: Number,
      default: 45,
      min: 0,
      max: 100,
    },

    monetizationEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Settings ||
  mongoose.model("Settings", settingsSchema);