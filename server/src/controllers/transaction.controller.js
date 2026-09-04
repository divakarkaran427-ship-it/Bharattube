const Transaction = require("../models/transaction.model");

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

// ==============================
// Get All Transactions
// ==============================

const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({
    creator: req.user._id,
  }).sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      transactions,
      "Transactions fetched successfully."
    )
  );
});

module.exports = {
  getTransactions,
};