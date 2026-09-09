const CopyrightReference = require("../models/copyrightReference.model");
const MediaFingerprint = require("../models/mediaFingerprint.model");
const CopyrightAuditLog = require("../models/copyrightAuditLog.model");
const Video = require("../models/video.model");
const Channel = require("../models/channel.model");
const {
  generateReferenceAudioFingerprintFromUrl,
} = require("../services/fingerprintService");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const createCopyrightReference = asyncHandler(async (req, res) => {
  const {
    video,
    channel,
    title,
    sourceType,
    sourceUrl = "",
    sourceDescription = "",
    notes = "",
  } = req.body;

  if (!title || !title.trim()) {
    throw new ApiError(400, "Reference title is required");
  }

  const allowedSourceTypes = [
    "original",
    "user_submission",
    "external_url",
    "manual_entry",
  ];

  if (!sourceType || !allowedSourceTypes.includes(sourceType)) {
    throw new ApiError(
      400,
      `sourceType must be one of: ${allowedSourceTypes.join(", ")}`
    );
  }

  if (!video) {
    throw new ApiError(400, "video is required");
  }

  const existingVideo = await Video.findById(video);

  if (!existingVideo) {
    throw new ApiError(404, "Video not found");
  }

  if (channel) {
    const existingChannel = await Channel.findById(channel);

    if (!existingChannel) {
      throw new ApiError(404, "Channel not found");
    }

    if (existingChannel.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to use this channel");
    }
  }

  const reference = await CopyrightReference.create({
    video,
    channel: channel || existingVideo.channel,
    ownerUser: req.user._id,
    title: title.trim(),
    sourceType,
    sourceUrl: sourceUrl.trim(),
    sourceDescription: sourceDescription.trim(),
    notes: notes.trim(),
    status: "active",
    createdBy: req.user._id,
  });

  let fingerprintStatus = {
    status: "skipped",
    reason: "Reference fingerprint was not generated.",
  };

  try {
    const existingFingerprint = await MediaFingerprint.findOne({
      reference: reference._id,
      mediaType: "audio",
    });

    if (existingFingerprint) {
      fingerprintStatus = {
        status: "already_present",
        fingerprintId: existingFingerprint._id,
      };
    } else {
      const fingerprintResult = await generateReferenceAudioFingerprintFromUrl(
        reference._id.toString(),
        existingVideo.videoUrl
      );

      if (fingerprintResult.ok) {
        const fingerprint = await MediaFingerprint.create({
          video: reference.video,
          reference: reference._id,
          mediaType: fingerprintResult.mediaType,
          fingerprintVersion: fingerprintResult.fingerprintVersion,
          hashSummary: fingerprintResult.hashSummary,
          featureSignature: fingerprintResult.featureSignature,
        });

        fingerprintStatus = {
          status: "persisted",
          fingerprintId: fingerprint._id,
        };
      } else {
        fingerprintStatus.reason = fingerprintResult.error;
        console.warn(
          "Copyright reference fingerprint generation skipped:",
          fingerprintResult.error
        );
      }
    }
  } catch (error) {
    fingerprintStatus.reason = error?.message || "Reference fingerprint persistence failed.";
    console.warn(
      "Copyright reference fingerprint persistence failed:",
      fingerprintStatus.reason
    );
  }

  await CopyrightAuditLog.create({
    entityType: "reference",
    entityId: reference._id,
    actorUser: req.user._id,
    actorRole: req.user.role || "user",
    action: "reference_created",
    oldStatus: null,
    newStatus: "active",
    message: "Copyright reference created",
    metadata: {
      video: reference.video,
      channel: reference.channel,
      sourceType: reference.sourceType,
    },
  });

  const fingerprintMessage =
    fingerprintStatus.status === "persisted"
      ? "; audio fingerprint persisted"
      : fingerprintStatus.status === "already_present"
        ? "; audio fingerprint already present"
          : "; audio fingerprint skipped";

  return res.status(201).json(
    new ApiResponse(
      201,
      `Copyright reference created successfully${fingerprintMessage}`,
      reference
    )
  );
});

module.exports = {
  createCopyrightReference,
};
