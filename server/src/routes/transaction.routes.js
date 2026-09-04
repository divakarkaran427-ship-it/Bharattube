const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
    getTransactions,
} = require("../controllers/transaction.controller");

// Get All Transactions
router.get(
    "/",
    authMiddleware,
    getTransactions
);

module.exports = router;