const Withdraw = require("../models/withdraw.model");
const Wallet = require("../models/wallet.model");

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

// ==========================================
// Create Withdraw Request
// ==========================================

const createWithdrawRequest = asyncHandler(async (req, res) => {
  const {
    amount,
    paymentMethod,
    upiId,
    bankDetails,
  } = req.body;

  const wallet = await Wallet.findOne({
    creator: req.user._id,
  });

  if (!wallet) {
    throw new ApiError(404, "Wallet not found.");
  }

  if (wallet.availableBalance < amount) {
    throw new ApiError(400, "Insufficient wallet balance.");
  }

  const withdraw = await Withdraw.create({
    creator: req.user._id,
    amount,
    paymentMethod,
    upiId,
    bankDetails,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      withdraw,
      "Withdraw request submitted successfully."
    )
  );
});

// ==========================================
// Get My Withdraw Requests
// ==========================================

const getMyWithdrawRequests = asyncHandler(async (req, res) => {
  const withdraws = await Withdraw.find({
    creator: req.user._id,
  }).sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      withdraws,
      "Withdraw requests fetched successfully."
    )
  );
});

module.exports = {
  createWithdrawRequest,
  getMyWithdrawRequests,
};