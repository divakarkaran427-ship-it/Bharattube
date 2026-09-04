const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    balanceAfterTransaction: {
      type: Number,
      required: true,
      min: 0,
    },

    source: {
      type: String,
      enum: [
        "video",
        "short",
        "withdraw",
        "superchat",
        "membership",
        "bonus",
        "referral",
      ],
      required: true,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
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

transactionSchema.index({ creator: 1, createdAt: -1 });
transactionSchema.index({ source: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);