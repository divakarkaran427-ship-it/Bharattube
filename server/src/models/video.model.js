const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      default: "",
      maxlength: 5000,
    },

    // Cloudinary Video
    videoUrl: {
      type: String,
      required: true,
    },

    videoPublicId: {
      type: String,
      required: true,
    },

    // Cloudinary Thumbnail
    thumbnail: {
      type: String,
      required: function () {
        return !this.isShort;
      },
    },

    thumbnailPublicId: {
      type: String,
      required: function () {
        return !this.isShort;
      },
    },

    duration: {
      type: Number,
      default: 0,
      min: 0,
    },

    category: {
      type: String,
      enum: [
        "Education",
        "Gaming",
        "Music",
        "Comedy",
        "News",
        "Technology",
        "Sports",
        "Entertainment",
        "Other",
      ],
      default: "Other",
      
    },

    language: {
      type: String,
      default: "english",
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    visibility: {
      type: String,
      enum: ["public", "private", "unlisted"],
      default: "public",
      index: true,
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ===== Migration Fields =====

    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    dislikesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Keep these until Like Engine migration is complete
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    dislikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    shares: {
      type: Number,
      default: 0,
      min: 0,
    },

    watchTime: {
      type: Number,
      default: 0,
      min: 0,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    isMonetized: {
      type: Boolean,
      default: false,
    },

    isShort: {
      type: Boolean,
      default: false,
      index: true,
    },

    aspectRatio: {
      type: String,
      enum: ["16:9", "9:16"],
      default: "16:9",
    },
  },
  {
    timestamps: true,
  }
);

// ---------------- Indexes ----------------

// Latest Videos
videoSchema.index({ createdAt: -1 });

// Creator Studio
videoSchema.index({ channel: 1, createdAt: -1 });

// Trending Videos
videoSchema.index({ views: -1 });

// Category Filter
videoSchema.index({ category: 1 });

// Tags Search
videoSchema.index({ tags: 1 });

// Full Text Search
videoSchema.index({
  title: "text",
  description: "text",
});

module.exports = mongoose.model("Video", videoSchema);