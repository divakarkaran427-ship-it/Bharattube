const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

// ==========================================
// Get My Wallet
// ==========================================

const getMyWallet = asyncHandler(async (req, res) => {

    const wallet = await Wallet.findOne({
        creator: req.user._id,
    });

    if (!wallet) {
        throw new ApiError(
            404,
            "Wallet not found."
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            wallet,
            "Wallet fetched successfully."
        )
    );
});

// ==========================================
// Get Recent Transactions
// ==========================================

const getRecentTransactions = asyncHandler(async (req, res) => {

    const transactions = await Transaction.find({
        creator: req.user._id,
    })
        .sort({ createdAt: -1 })
        .limit(10);

    return res.status(200).json(
        new ApiResponse(
            200,
            transactions,
            "Recent transactions fetched successfully."
        )
    );
});

module.exports = {
    getMyWallet,
    getRecentTransactions,
};