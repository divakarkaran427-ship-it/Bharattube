const Video = require("../models/video.model");
const MediaFingerprint = require("../models/mediaFingerprint.model");
const Channel = require("../models/channel.model");
const { createNotifications } = require("../services/notification.service");

const uploadToCloudinary = require("../utils/cloudinaryUpload");
const { generateVideoFingerprint } = require("../services/videoFingerprintService");
const {
  matchSourceVideoAgainstActiveReferences,
} = require("../services/fingerprintMatchingService");
const cloudinary = require("../config/cloudinary");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// ==========================
// Upload Video
// ==========================

const uploadVideo = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    language,
    tags,
    visibility,
    isShort,
  } = req.body;
  const shortUpload = isShort === "true";

  const channel = await Channel.findOne({
    owner: req.user._id,
  });

  if (!channel) {
    throw new ApiError(404, "Create your channel first");
  }

  if (!req.files || !req.files.video || (!shortUpload && !req.files.thumbnail)) {
    throw new ApiError(
      400,
      "Video and Thumbnail are required"
    );
  }

  let fingerprintResult = null;

  try {
    fingerprintResult = generateVideoFingerprint(req.files.video[0].path);

    if (!fingerprintResult || !fingerprintResult.ok) {
      console.warn(
        "Video fingerprint generation skipped:",
        fingerprintResult?.error || "Unknown fingerprint error"
      );
    }
  } catch (error) {
    console.warn(
      "Video fingerprint generation failed:",
      error?.message || "Unknown fingerprint error"
    );
  }

  // Upload Video & Thumbnail Parallel
  const [uploadedVideo, uploadedThumbnail] = await Promise.all([
    uploadToCloudinary(
      req.files.video[0].path,
      "bharattube/videos",
      "video"
    ),

    req.files.thumbnail
      ? uploadToCloudinary(
          req.files.thumbnail[0].path,
          "bharattube/thumbnails",
          "image"
        )
      : null,
  ]);

  const video = await Video.create({
    channel: channel._id,

    title,
    description,

    videoUrl: uploadedVideo.secure_url,
    videoPublicId: uploadedVideo.public_id,

    ...(uploadedThumbnail && {
      thumbnail: uploadedThumbnail.secure_url,
      thumbnailPublicId: uploadedThumbnail.public_id,
    }),

    duration: uploadedVideo.duration,

    category,
    language,
    visibility,

    tags: tags
      ? tags.split(",").map((tag) => tag.trim())
      : [],

    isShort: shortUpload,

    aspectRatio:
      isShort === "true"
        ? "9:16"
        : "16:9",
  });

  if (fingerprintResult?.ok) {
    try {
      await MediaFingerprint.create({
        video: video._id,
        mediaType: fingerprintResult.mediaType,
        fingerprintVersion: fingerprintResult.fingerprintVersion,
        hashSummary: fingerprintResult.hashSummary,
        featureSignature: fingerprintResult.featureSignature,
      });

      matchSourceVideoAgainstActiveReferences({
        sourceVideoId: video._id,
      }).catch((error) => {
        console.warn(
          "Video fingerprint matching failed:",
          error?.message || "Unknown fingerprint matching error"
        );
      });
    } catch (error) {
      console.warn(
        "Video fingerprint persistence failed:",
        error?.message || "Unknown fingerprint persistence error"
      );
    }
  }

  channel.totalVideos += 1;

  await channel.save();

  if (video.visibility === "public" && channel.subscribers.length > 0) {
    createNotifications({
      sender: req.user._id,
      receivers: channel.subscribers,
      type: "video",
      message: `${channel.channelName} uploaded a new video`,
      video: video._id,
    }).catch((error) => {
      console.error("Unable to create upload notifications:", error.message);
    });
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      "Video uploaded successfully",
      video
    )
  );
});
// ==========================
// Get All Videos (Home Feed)
// ==========================

const getAllVideos = asyncHandler(async (req, res) => {
  let {
    page = 1,
    limit = 10,
    search = "",
    category,
    language,
    exclude,
  } = req.query;

  page = Number(page);
  limit = Number(limit);

  const filter = {
    visibility: "public",
    isPublished: true,
    isShort: false,
  };

  if (search) {
    filter.title = {
      $regex: search,
      $options: "i",
    };
  }

  if (category) {
    filter.category = category;
  }

  if (language) {
    filter.language = language;
  }

  // Exclude current video (Watch Page Related Videos)
  if (exclude) {
    filter._id = { $ne: exclude };
  }

  const [totalVideos, videos] = await Promise.all([
    Video.countDocuments(filter),

    Video.find(filter)
      .populate({
        path: "channel",
        select: "channelName handle logo verified subscribers",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      "Videos fetched successfully",
      {
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalVideos / limit),
          totalVideos,
          hasNextPage: page * limit < totalVideos,
          hasPrevPage: page > 1,
        },

        videos,
      }
    )
  );
});
// ==========================
// Get Single Video
// ==========================

const getVideoById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const video = await Video.findById(id)
    .populate({
      path: "channel",
      select: "channelName handle logo verified subscribers",
    })
    .lean();

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Increase video views & channel views in parallel
  return res.status(200).json(
    new ApiResponse(
      200,
      "Video fetched successfully",
      video
    )
  );
});
// ==========================
// Update Video
// ==========================

const updateVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, category, language } = req.body;

  const channel = await Channel.findOne({
    owner: req.user._id,
  }).lean();

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const video = await Video.findById(id);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.channel.toString() !== channel._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to update this video"
    );
  }

  if (title !== undefined) video.title = title;
  if (description !== undefined) video.description = description;
  if (category !== undefined) video.category = category;
  if (language !== undefined) video.language = language;

  await video.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      "Video updated successfully",
      video
    )
  );
});

// ==========================
// Toggle Visibility
// ==========================

const toggleVisibility = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const channel = await Channel.findOne({
    owner: req.user._id,
  }).lean();

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const video = await Video.findById(id);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.channel.toString() !== channel._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to update this video"
    );
  }

  video.visibility =
    video.visibility === "public"
      ? "private"
      : "public";

  await video.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      "Video visibility updated successfully",
      {
        visibility: video.visibility,
      }
    )
  );
});

// ==========================
// Delete Video
// ==========================

const deleteVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const channel = await Channel.findOne({
    owner: req.user._id,
  }).lean();

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const video = await Video.findById(id);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.channel.toString() !== channel._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to delete this video"
    );
  }

  // Delete Video & Thumbnail from Cloudinary in parallel
  await Promise.all([
    cloudinary.uploader.destroy(video.videoPublicId, {
      resource_type: "video",
    }),

    cloudinary.uploader.destroy(video.thumbnailPublicId),
  ]);

  // Delete Video & Update Channel Count in parallel
  await Promise.all([
    video.deleteOne(),

    Channel.findByIdAndUpdate(channel._id, {
      $inc: {
        totalVideos: -1,
      },
    }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      "Video deleted successfully"
    )
  );
});
module.exports = {
  uploadVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  toggleVisibility,
  deleteVideo,
};
