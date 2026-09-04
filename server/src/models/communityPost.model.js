const mongoose = require("mongoose");

const pollOptionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    votes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const communityPostSchema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
      index: true,
    },

    content: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    images: [
  {
    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },
  },
],
    poll: {
      question: {
        type: String,
        trim: true,
        default: "",
      },

      options: [pollOptionSchema],
    },

    hashtags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
      index: true,
    },

    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    sharesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ channel: 1, createdAt: -1 });
communityPostSchema.index({ hashtags: 1 });

module.exports = mongoose.model("CommunityPost", communityPostSchema);