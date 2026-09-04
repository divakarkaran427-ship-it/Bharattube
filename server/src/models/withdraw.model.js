const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 100,
    },

    paymentMethod: {
      type: String,
      enum: ["upi", "bank"],
      required: true,
    },

    upiId: {
      type: String,
      trim: true,
      default: "",
    },

    bankDetails: {
      accountHolderName: {
        type: String,
        default: "",
        trim: true,
      },
      accountNumber: {
        type: String,
        default: "",
        trim: true,
      },
      ifscCode: {
        type: String,
        default: "",
        trim: true,
      },
      bankName: {
        type: String,
        default: "",
        trim: true,
      },
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    adminRemark: {
      type: String,
      default: "",
      trim: true,
    },

    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

withdrawSchema.index({ creator: 1, status: 1 });

module.exports =
  mongoose.models.Withdraw ||
  mongoose.model("Withdraw", withdrawSchema);