const CopyrightTakedown = require("../models/copyrightTakedown.model");
const CopyrightClaim = require("../models/copyrightClaim.model");
const CopyrightDispute = require("../models/copyrightDispute.model");
const CopyrightAuditLog = require("../models/copyrightAuditLog.model");
const Video = require("../models/video.model");
const Channel = require("../models/channel.model");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const createCopyrightTakedown = asyncHandler(async (req, res) => {
  const {
    video,
    claim,
    dispute,
    reason,
    evidence = "",
    requestedBy = "rights_owner",
    requesterChannel,
  } = req.body;

  const allowedRequestedBy = ["rights_owner", "authorized_representative", "admin"];

  if (!video) {
    throw new ApiError(400, "video is required");
  }

  if (!reason || !reason.trim()) {
    throw new ApiError(400, "reason is required");
  }

  if (!allowedRequestedBy.includes(requestedBy)) {
    throw new ApiError(
      400,
      `requestedBy must be one of: ${allowedRequestedBy.join(", ")}`
    );
  }

  const targetVideo = await Video.findById(video);

  if (!targetVideo) {
    throw new ApiError(404, "Video not found");
  }

  if (claim) {
    const existingClaim = await CopyrightClaim.findById(claim);

    if (!existingClaim) {
      throw new ApiError(404, "Claim not found");
    }

    if (existingClaim.video.toString() !== targetVideo._id.toString()) {
      throw new ApiError(400, "Claim does not match the target video");
    }
  }

  if (dispute) {
    const existingDispute = await CopyrightDispute.findById(dispute);

    if (!existingDispute) {
      throw new ApiError(404, "Dispute not found");
    }

    if (existingDispute.video.toString() !== targetVideo._id.toString()) {
      throw new ApiError(400, "Dispute does not match the target video");
    }

    if (claim && existingDispute.claim.toString() !== claim.toString()) {
      throw new ApiError(400, "Dispute does not match the provided claim");
    }
  }

  const targetChannel = await Channel.findById(targetVideo.channel);

  if (!targetChannel) {
    throw new ApiError(404, "Channel not found for target video");
  }

  const isVideoOwner =
    targetChannel.owner && targetChannel.owner.toString() === req.user._id.toString();

  let requesterChannelOwner = false;

  if (requesterChannel) {
    const requestChannel = await Channel.findById(requesterChannel);

    if (!requestChannel) {
      throw new ApiError(404, "Requester channel not found");
    }

    requesterChannelOwner =
      requestChannel.owner && requestChannel.owner.toString() === req.user._id.toString();
  }

  const isAuthorizedRequester =
    req.user.role === "admin" || isVideoOwner || requesterChannelOwner;

  if (!isAuthorizedRequester) {
    throw new ApiError(403, "You are not authorized to file a takedown request");
  }

  const takedown = await CopyrightTakedown.create({
    video: targetVideo._id,
    claim: claim || null,
    dispute: dispute || null,
    requesterUser: req.user._id,
    requesterChannel: requesterChannel || null,
    requestedBy,
    reason: reason.trim(),
    evidence: evidence.trim(),
    status: "pending",
  });

  await CopyrightAuditLog.create({
    entityType: "takedown",
    entityId: takedown._id,
    actorUser: req.user._id,
    actorRole: req.user.role || "user",
    action: "takedown_submitted",
    oldStatus: null,
    newStatus: "pending",
    message: "Copyright takedown submitted",
    metadata: {
      video: targetVideo._id,
      requesterUser: req.user._id,
      requestedBy,
    },
  });

  return res.status(201).json(
    new ApiResponse(201, "Copyright takedown created successfully", takedown)
  );
});

const reviewCopyrightTakedown = asyncHandler(async (req, res) => {
  const { takedownId } = req.params;
  const { status, decisionReason } = req.body;

  const allowedStatuses = ["approved", "rejected"];

  if (!status || !allowedStatuses.includes(status)) {
    throw new ApiError(
      400,
      `status must be one of: ${allowedStatuses.join(", ")}`
    );
  }

  if (!decisionReason || !decisionReason.trim()) {
    throw new ApiError(400, "decisionReason is required");
  }

  if (!req.user || req.user.role !== "admin") {
    throw new ApiError(403, "Only admin can review takedowns");
  }

  const takedown = await CopyrightTakedown.findById(takedownId);

  if (!takedown) {
    throw new ApiError(404, "Copyright takedown not found");
  }

  if (takedown.status !== "pending") {
    throw new ApiError(400, "This takedown has already been reviewed");
  }

  const previousStatus = takedown.status;
  const video = await Video.findById(takedown.video);

  if (!video) {
    throw new ApiError(404, "Video linked to takedown not found");
  }

  takedown.status = status;
  takedown.reviewedBy = req.user._id;
  takedown.reviewNotes = decisionReason.trim();
  takedown.decisionReason = decisionReason.trim();
  takedown.reviewedAt = new Date();

  if (status === "approved") {
    if (takedown.claim) {
      const claim = await CopyrightClaim.findById(takedown.claim);

      if (claim && ["pending", "under_review"].includes(claim.status)) {
        claim.status = "valid";
        await claim.save();
      }
    }

    if (takedown.dispute) {
      const dispute = await CopyrightDispute.findById(takedown.dispute);

      if (dispute && ["open", "under_review"].includes(dispute.status)) {
        dispute.status = "resolved";
        dispute.resolution = decisionReason.trim();
        dispute.resolvedBy = req.user._id;
        dispute.resolvedAt = new Date();
        await dispute.save();
      }
    }

    const previousVisibility = video.visibility;
    video.visibility = "private";
    await video.save();

    await CopyrightAuditLog.create({
      entityType: "takedown",
      entityId: takedown._id,
      actorUser: req.user._id,
      actorRole: req.user.role || "admin",
      action: "takedown_approved",
      oldStatus: previousStatus,
      newStatus: status,
      message: "Copyright takedown approved",
      metadata: {
        video: video._id,
        previousVisibility,
        newVisibility: video.visibility,
      },
    });

    await CopyrightAuditLog.create({
      entityType: "video",
      entityId: video._id,
      actorUser: req.user._id,
      actorRole: req.user.role || "admin",
      action: "video_visibility_restricted",
      oldStatus: previousVisibility,
      newStatus: video.visibility,
      message: "Video visibility set to private after takedown approval",
      metadata: {
        takedown: takedown._id,
      },
    });
  } else {
    await CopyrightAuditLog.create({
      entityType: "takedown",
      entityId: takedown._id,
      actorUser: req.user._id,
      actorRole: req.user.role || "admin",
      action: "takedown_rejected",
      oldStatus: previousStatus,
      newStatus: status,
      message: "Copyright takedown rejected",
      metadata: {
        video: video._id,
        decisionReason: decisionReason.trim(),
      },
    });
  }

  await takedown.save();

  return res.status(200).json(
    new ApiResponse(200, "Takedown status updated successfully", takedown)
  );
});

module.exports = {
  createCopyrightTakedown,
  reviewCopyrightTakedown,
};
