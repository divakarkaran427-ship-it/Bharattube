const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

const {
  getPendingWithdraws,
  approveWithdraw,
  rejectWithdraw,
} = require("../controllers/adminWithdraw.controller");

// Get Pending Withdraw Requests
router.get(
  "/pending",
  authMiddleware,
  adminMiddleware,
  getPendingWithdraws
);

// Approve Withdraw
router.patch(
  "/:id/approve",
  authMiddleware,
  adminMiddleware,
  approveWithdraw
);

// Reject Withdraw
router.patch(
  "/:id/reject",
  authMiddleware,
  adminMiddleware,
  rejectWithdraw
);

module.exports = router;