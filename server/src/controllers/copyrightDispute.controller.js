const CopyrightClaim = require("../models/copyrightClaim.model");
const CopyrightDispute = require("../models/copyrightDispute.model");
const CopyrightAuditLog = require("../models/copyrightAuditLog.model");
const CopyrightTakedown = require("../models/copyrightTakedown.model");
const Video = require("../models/video.model");
const Channel = require("../models/channel.model");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const createCopyrightDispute = asyncHandler(async (req, res) => {
  const { claimId } = req.params;
  const { reason, evidence = "" } = req.body;

  if (!reason || !reason.trim()) {
    throw new ApiError(400, "reason is required");
  }

  const claim = await CopyrightClaim.findById(claimId);

  if (!claim) {
    throw new ApiError(404, "Copyright claim not found");
  }

  const isEligibleForDispute = ["pending", "under_review", "valid"].includes(claim.status);

  if (!isEligibleForDispute) {
    throw new ApiError(400, "This claim is not eligible for dispute");
  }

  const video = await Video.findById(claim.video);

  if (!video) {
    throw new ApiError(404, "Video not found for this claim");
  }

  if (!video.channel) {
    throw new ApiError(400, "Video channel not available");
  }

  const uploaderChannel = await Channel.findById(video.channel);

  if (!uploaderChannel) {
    throw new ApiError(404, "Channel not found for this video");
  }

  if (uploaderChannel.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to dispute this claim");
  }

  const dispute = await CopyrightDispute.create({
    claim: claim._id,
    video: video._id,
    uploaderUser: req.user._id,
    uploaderChannel: uploaderChannel._id,
    reason: reason.trim(),
    evidence: evidence.trim(),
    status: "open",
  });

  await CopyrightAuditLog.create({
    entityType: "dispute",
    entityId: dispute._id,
    actorUser: req.user._id,
    actorRole: req.user.role || "user",
    action: "dispute_opened",
    oldStatus: null,
    newStatus: "open",
    message: "Copyright dispute opened",
    metadata: {
      claim: claim._id,
      video: video._id,
      uploaderUser: req.user._id,
    },
  });

  return res.status(201).json(
    new ApiResponse(201, "Copyright dispute created successfully", dispute)
  );
});

const reviewCopyrightDispute = asyncHandler(async (req, res) => {
  const { disputeId } = req.params;
  const { status, resolution } = req.body;

  const allowedStatuses = ["under_review", "resolved", "rejected"];

  if (!status || !allowedStatuses.includes(status)) {
    throw new ApiError(
      400,
      `status must be one of: ${allowedStatuses.join(", ")}`
    );
  }

  if (["resolved", "rejected"].includes(status) && (!resolution || !resolution.trim())) {
    throw new ApiError(400, "resolution is required when resolving or rejecting a dispute");
  }

  const dispute = await CopyrightDispute.findById(disputeId);

  if (!dispute) {
    throw new ApiError(404, "Copyright dispute not found");
  }

  const claim = await CopyrightClaim.findById(dispute.claim);

  if (!claim) {
    throw new ApiError(404, "Claim linked to dispute not found");
  }

  if (["resolved", "rejected"].includes(dispute.status)) {
    throw new ApiError(400, "This dispute has already been resolved");
  }

  if (!req.user || req.user.role !== "admin") {
    throw new ApiError(403, "Only admin can review disputes");
  }

  const linkedApprovedTakedown = await CopyrightTakedown.findOne({
    dispute: dispute._id,
    status: "approved",
  });

  if (linkedApprovedTakedown) {
    throw new ApiError(400, "This dispute cannot be resolved because a linked takedown is already approved");
  }

  const previousStatus = dispute.status;

  dispute.status = status;
  dispute.resolution = resolution ? resolution.trim() : dispute.resolution;
  dispute.resolvedBy = req.user._id;
  dispute.resolvedAt = ["resolved", "rejected"].includes(status) ? new Date() : null;

  await dispute.save();

  await CopyrightAuditLog.create({
    entityType: "dispute",
    entityId: dispute._id,
    actorUser: req.user._id,
    actorRole: req.user.role || "admin",
    action: "dispute_status_updated",
    oldStatus: previousStatus,
    newStatus: status,
    message: `Dispute status updated to ${status}`,
    metadata: {
      claim: claim._id,
      video: dispute.video,
      resolution: dispute.resolution,
    },
  });

  return res.status(200).json(
    new ApiResponse(200, "Dispute status updated successfully", dispute)
  );
});

module.exports = {
  createCopyrightDispute,
  reviewCopyrightDispute,
};
