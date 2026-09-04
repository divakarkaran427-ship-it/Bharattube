const CopyrightStrike = require("../models/copyrightStrike.model");
const CopyrightAuditLog = require("../models/copyrightAuditLog.model");
const Video = require("../models/video.model");
const Channel = require("../models/channel.model");
const CopyrightClaim = require("../models/copyrightClaim.model");
const CopyrightDispute = require("../models/copyrightDispute.model");
const CopyrightTakedown = require("../models/copyrightTakedown.model");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const getStrikeLevelFromActiveCount = (count) => {
  if (count >= 3) return "3";
  if (count === 2) return "2";
  return "1";
};

const createCopyrightStrike = asyncHandler(async (req, res) => {
  const {
    video,
    claim,
    dispute,
    takedown,
    reason,
    decision = "",
    notes = "",
  } = req.body;

  if (!req.user || req.user.role !== "admin") {
    throw new ApiError(403, "Only admin can issue strikes");
  }

  if (!video) {
    throw new ApiError(400, "video is required");
  }

  if (!reason || !reason.trim()) {
    throw new ApiError(400, "reason is required");
  }

  const targetVideo = await Video.findById(video);

  if (!targetVideo) {
    throw new ApiError(404, "Video not found");
  }

  if (!targetVideo.channel) {
    throw new ApiError(400, "Video channel not found");
  }

  const targetChannel = await Channel.findById(targetVideo.channel);

  if (!targetChannel) {
    throw new ApiError(404, "Channel not found for target video");
  }

  if (!takedown) {
    throw new ApiError(400, "A strike can only be issued after an approved takedown");
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
  }

  if (takedown) {
    const existingTakedown = await CopyrightTakedown.findById(takedown);

    if (!existingTakedown) {
      throw new ApiError(404, "Takedown not found");
    }

    if (existingTakedown.video.toString() !== targetVideo._id.toString()) {
      throw new ApiError(400, "Takedown does not match the target video");
    }

    if (existingTakedown.status !== "approved") {
      throw new ApiError(400, "A strike can only be issued after an approved takedown");
    }
  }

  const activeStrikeCount = await CopyrightStrike.countDocuments({
    struckUser: targetChannel.owner,
    status: "active",
  });

  const strikeLevel = getStrikeLevelFromActiveCount(activeStrikeCount + 1);

  const strike = await CopyrightStrike.create({
    video: targetVideo._id,
    claim: claim || null,
    dispute: dispute || null,
    takedown: takedown || null,
    struckUser: targetChannel.owner,
    struckChannel: targetChannel._id,
    issuedBy: req.user._id,
    issuedByRole: req.user.role,
    reason: reason.trim(),
    decision: decision.trim(),
    status: "active",
    strikeLevel,
    notes: notes.trim(),
  });

  await CopyrightAuditLog.create({
    entityType: "strike",
    entityId: strike._id,
    actorUser: req.user._id,
    actorRole: req.user.role,
    action: "strike_issued",
    oldStatus: null,
    newStatus: "active",
    message: "Copyright strike issued",
    metadata: {
      video: strike.video,
      struckUser: strike.struckUser,
      struckChannel: strike.struckChannel,
      strikeLevel: strike.strikeLevel,
    },
  });

  return res.status(201).json(
    new ApiResponse(201, "Copyright strike created successfully", strike)
  );
});

const reviewCopyrightStrike = asyncHandler(async (req, res) => {
  const { strikeId } = req.params;
  const { status, decisionReason } = req.body;

  const allowedStatuses = ["reversed", "expired"];

  if (!req.user || req.user.role !== "admin") {
    throw new ApiError(403, "Only admin can review strikes");
  }

  if (!status || !allowedStatuses.includes(status)) {
    throw new ApiError(
      400,
      `status must be one of: ${allowedStatuses.join(", ")}`
    );
  }

  if (!decisionReason || !decisionReason.trim()) {
    throw new ApiError(400, "decisionReason is required");
  }

  const strike = await CopyrightStrike.findById(strikeId);

  if (!strike) {
    throw new ApiError(404, "Copyright strike not found");
  }

  if (!["active", "appealed"].includes(strike.status)) {
    throw new ApiError(400, "This strike has already been resolved");
  }

  const previousStatus = strike.status;

  strike.status = status;
  strike.decision = decisionReason.trim();
  strike.resolvedAt = new Date();

  await strike.save();

  await CopyrightAuditLog.create({
    entityType: "strike",
    entityId: strike._id,
    actorUser: req.user._id,
    actorRole: req.user.role,
    action: status === "reversed" ? "strike_reversed" : "strike_expired",
    oldStatus: previousStatus,
    newStatus: status,
    message: `Strike status updated to ${status}`,
    metadata: {
      video: strike.video,
      struckUser: strike.struckUser,
      decisionReason: decisionReason.trim(),
    },
  });

  return res.status(200).json(
    new ApiResponse(200, "Strike status updated successfully", strike)
  );
});

const createStrikeAppeal = asyncHandler(async (req, res) => {
  const { strikeId } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    throw new ApiError(400, "reason is required");
  }

  const strike = await CopyrightStrike.findById(strikeId);

  if (!strike) {
    throw new ApiError(404, "Copyright strike not found");
  }

  if (strike.struckUser.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to appeal this strike");
  }

  if (strike.status !== "active") {
    throw new ApiError(400, "Only active strikes can be appealed");
  }

  strike.status = "appealed";
  strike.appealedAt = new Date();
  strike.notes = reason.trim();

  await strike.save();

  await CopyrightAuditLog.create({
    entityType: "strike",
    entityId: strike._id,
    actorUser: req.user._id,
    actorRole: "user",
    action: "strike_appealed",
    oldStatus: "active",
    newStatus: "appealed",
    message: "Copyright strike appeal submitted",
    metadata: {
      video: strike.video,
      struckUser: strike.struckUser,
      reason: reason.trim(),
    },
  });

  return res.status(200).json(
    new ApiResponse(200, "Strike appeal submitted successfully", strike)
  );
});

const getStrikes = asyncHandler(async (req, res) => {
  const isAdmin = req.user && ["admin", "moderator"].includes(req.user.role);

  const filter = isAdmin ? {} : { struckUser: req.user._id };

  const strikes = await CopyrightStrike.find(filter)
    .sort({ issuedAt: -1 })
    .lean();

  return res.status(200).json(
    new ApiResponse(200, "Strikes fetched successfully", strikes)
  );
});

const getStrikeById = asyncHandler(async (req, res) => {
  const { strikeId } = req.params;

  const strike = await CopyrightStrike.findById(strikeId).lean();

  if (!strike) {
    throw new ApiError(404, "Copyright strike not found");
  }

  const isAdmin = req.user && ["admin", "moderator"].includes(req.user.role);

  if (!isAdmin && strike.struckUser.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to view this strike");
  }

  return res.status(200).json(
    new ApiResponse(200, "Strike fetched successfully", strike)
  );
});

module.exports = {
  createCopyrightStrike,
  reviewCopyrightStrike,
  createStrikeAppeal,
  getStrikes,
  getStrikeById,
};
