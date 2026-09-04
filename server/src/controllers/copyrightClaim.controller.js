const CopyrightClaim = require("../models/copyrightClaim.model");
const CopyrightAuditLog = require("../models/copyrightAuditLog.model");
const Video = require("../models/video.model");
const Channel = require("../models/channel.model");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const getCreatorCopyrightClaims = asyncHandler(async (req, res) => {
  const channels = await Channel.find({ owner: req.user._id }).select("_id").lean();
  const channelIds = channels.map((channel) => channel._id);
  const videos = channelIds.length
    ? await Video.find({ channel: { $in: channelIds } }).select("_id").lean()
    : [];
  const videoIds = videos.map((video) => video._id);

  const claims = videoIds.length
    ? await CopyrightClaim.find({ video: { $in: videoIds } })
        .select("_id video claimantUser claimantChannel reference claimType reason evidence status submittedAt reviewedAt")
        .sort({ submittedAt: -1 })
        .lean()
    : [];

  return res.status(200).json(
    new ApiResponse(200, "Copyright claims fetched successfully", claims)
  );
});

const createCopyrightClaimRecord = async ({
  video,
  claimantUser,
  claimantChannel = null,
  reference = null,
  claimType,
  reason,
  evidence = "",
  actorUser,
  actorRole = "system",
}) => {
  const claim = await CopyrightClaim.create({
    video,
    claimantUser,
    claimantChannel,
    reference,
    claimType,
    reason: reason.trim(),
    evidence: evidence.trim(),
    status: "pending",
    submittedAt: new Date(),
  });

  await CopyrightAuditLog.create({
    entityType: "claim",
    entityId: claim._id,
    actorUser,
    actorRole,
    action: "claim_submitted",
    oldStatus: null,
    newStatus: "pending",
    message: "Copyright claim submitted",
    metadata: {
      video: claim.video,
      claimantUser: claim.claimantUser,
      claimType: claim.claimType,
    },
  });

  return claim;
};

const createCopyrightClaim = asyncHandler(async (req, res) => {
  const {
    video,
    reference,
    claimType,
    reason,
    evidence = "",
    claimantChannel,
  } = req.body;

  const allowedClaimTypes = ["manual", "automated", "user_report"];

  if (!video) {
    throw new ApiError(400, "video is required");
  }

  if (!reason || !reason.trim()) {
    throw new ApiError(400, "reason is required");
  }

  if (!claimType || !allowedClaimTypes.includes(claimType)) {
    throw new ApiError(
      400,
      `claimType must be one of: ${allowedClaimTypes.join(", ")}`
    );
  }

  const existingVideo = await Video.findById(video);

  if (!existingVideo) {
    throw new ApiError(404, "Video not found");
  }

  const existingChannel = await Channel.findById(existingVideo.channel);

  if (!existingChannel) {
    throw new ApiError(404, "Channel not found for this video");
  }

  if (existingChannel.owner && existingChannel.owner.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot file a claim on your own channel's video");
  }

  if (reference) {
    const existingReference = await require("../models/copyrightReference.model").findById(reference);

    if (!existingReference) {
      throw new ApiError(404, "Reference not found");
    }
  }

  if (claimantChannel) {
    const existingChannel = await Channel.findById(claimantChannel);

    if (!existingChannel) {
      throw new ApiError(404, "Channel not found");
    }

    if (existingChannel.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to use this channel");
    }
  }

  const claim = await createCopyrightClaimRecord({
    video,
    claimantUser: req.user._id,
    claimantChannel: claimantChannel || null,
    reference: reference || null,
    claimType,
    reason: reason.trim(),
    evidence: evidence.trim(),
    status: "pending",
    actorUser: req.user._id,
    actorRole: req.user.role || "user",
  });

  return res.status(201).json(
    new ApiResponse(201, "Copyright claim created successfully", claim)
  );
});

module.exports = {
  getCreatorCopyrightClaims,
  createCopyrightClaim,
  createCopyrightClaimRecord,
};
