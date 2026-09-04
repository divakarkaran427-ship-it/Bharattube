const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
    getMyWallet,
    getRecentTransactions,
} = require("../controllers/wallet.controller");

// Get My Wallet
router.get(
    "/",
    authMiddleware,
    getMyWallet
);

// Recent Transactions
router.get(
    "/transactions",
    authMiddleware,
    getRecentTransactions
);

module.exports = router;