const mongoose = require("mongoose");

const earningSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    source: {
      type: String,
      enum: [
        "video",
        "short",
        "superchat",
        "membership",
        "bonus",
        "referral",
      ],
      required: true,
    },

    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    rpm: {
      type: Number,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "paid"],
      default: "pending",
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

earningSchema.index({ creator: 1 });
earningSchema.index({ source: 1 });
earningSchema.index({ status: 1 });

module.exports =
  mongoose.models.Earning ||
  mongoose.model("Earning", earningSchema);