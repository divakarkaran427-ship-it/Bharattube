const Withdraw = require("../models/withdraw.model");

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const { debitWallet } = require("../services/wallet.service");

// ==========================================
// Get Pending Withdraw Requests
// ==========================================

const getPendingWithdraws = asyncHandler(async (req, res) => {
  const withdraws = await Withdraw.find({
    status: "pending",
  })
    .populate("creator", "name email")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      withdraws,
      "Pending withdraw requests fetched successfully."
    )
  );
});

// ==========================================
// Approve Withdraw
// ==========================================

const approveWithdraw = asyncHandler(async (req, res) => {
  const withdraw = await Withdraw.findById(req.params.id);

  if (!withdraw) {
    throw new ApiError(404, "Withdraw request not found.");
  }

  if (withdraw.status !== "pending") {
    throw new ApiError(400, "Withdraw request already processed.");
  }

  await debitWallet({
    creatorId: withdraw.creator,
    amount: withdraw.amount,
    source: "withdraw",
    description: "Withdraw approved",
    referenceId: withdraw._id,
  });

  withdraw.status = "approved";
  withdraw.processedAt = new Date();

  await withdraw.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      withdraw,
      "Withdraw approved successfully."
    )
  );
});

// ==========================================
// Reject Withdraw
// ==========================================

const rejectWithdraw = asyncHandler(async (req, res) => {
  const withdraw = await Withdraw.findById(req.params.id);

  if (!withdraw) {
    throw new ApiError(404, "Withdraw request not found.");
  }

  if (withdraw.status !== "pending") {
    throw new ApiError(400, "Withdraw request already processed.");
  }

  withdraw.status = "rejected";
  withdraw.processedAt = new Date();

  await withdraw.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      withdraw,
      "Withdraw rejected successfully."
    )
  );
});

module.exports = {
  getPendingWithdraws,
  approveWithdraw,
  rejectWithdraw,
};