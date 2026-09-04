const MatchResult = require("../models/matchResult.model");
const CopyrightClaim = require("../models/copyrightClaim.model");
const CopyrightReference = require("../models/copyrightReference.model");
const { createCopyrightClaimRecord } = require("./copyrightClaim.controller");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const createClaimFromReviewedMatch = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    throw new ApiError(403, "Only admin can create claims from matches");
  }

  const matchResult = await MatchResult.findById(req.params.matchResultId);

  if (!matchResult) {
    throw new ApiError(404, "Copyright match result not found");
  }

  if (matchResult.status !== "reviewed_valid") {
    throw new ApiError(400, "Only reviewed valid matches can create claims");
  }

  if (!matchResult.reference) {
    throw new ApiError(400, "A copyright reference is required to create a claim");
  }

  const reference = await CopyrightReference.findById(matchResult.reference);

  if (!reference) {
    throw new ApiError(404, "Reference not found");
  }

  const claimantUser = reference.ownerUser || reference.createdBy;

  if (!claimantUser) {
    throw new ApiError(400, "Reference has no rights owner");
  }

  const existingClaim = await CopyrightClaim.findOne({
    video: matchResult.sourceVideo,
    reference: matchResult.reference,
  });

  if (existingClaim) {
    throw new ApiError(409, "A claim already exists for this video and reference");
  }

  const claim = await createCopyrightClaimRecord({
    video: matchResult.sourceVideo,
    claimantUser,
    claimantChannel: reference.channel || null,
    reference: matchResult.reference,
    claimType: "automated",
    reason: `Fingerprint match confirmed for ${matchResult.matchType} media (score: ${matchResult.score}).`,
    evidence: `MatchResult ${matchResult._id}; fingerprint version: v1; score: ${matchResult.score}.`,
    actorUser: req.user._id,
    actorRole: req.user.role,
  });

  return res.status(201).json(
    new ApiResponse(201, "Copyright claim created from reviewed match", claim)
  );
});

module.exports = {
  createClaimFromReviewedMatch,
};