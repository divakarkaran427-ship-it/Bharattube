const MatchResult = require("../models/matchResult.model");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const listPendingCopyrightMatches = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    throw new ApiError(403, "Only admin can review copyright matches");
  }

  const matches = await MatchResult.find({
    status: { $in: ["pending_review", "potential_match"] },
  })
    .sort({ score: -1, createdAt: -1 })
    .lean();

  return res.status(200).json(
    new ApiResponse(200, "Pending copyright matches fetched successfully", matches)
  );
});

const reviewCopyrightMatch = asyncHandler(async (req, res) => {
  const { matchResultId } = req.params;
  const { decision } = req.body;

  if (!req.user || req.user.role !== "admin") {
    throw new ApiError(403, "Only admin can review copyright matches");
  }

  if (!decision || !["valid", "rejected"].includes(decision)) {
    throw new ApiError(400, "decision must be one of: valid, rejected");
  }

  const matchResult = await MatchResult.findById(matchResultId);

  if (!matchResult) {
    throw new ApiError(404, "Copyright match result not found");
  }

  if (!["pending_review", "potential_match"].includes(matchResult.status)) {
    throw new ApiError(400, "This copyright match has already been reviewed");
  }

  matchResult.status = decision === "valid" ? "reviewed_valid" : "reviewed_rejected";
  matchResult.reviewedBy = req.user._id;
  matchResult.reviewDecision = decision;
  matchResult.reviewedAt = new Date();

  await matchResult.save();

  return res.status(200).json(
    new ApiResponse(200, "Copyright match reviewed successfully", matchResult)
  );
});

module.exports = {
  listPendingCopyrightMatches,
  reviewCopyrightMatch,
};