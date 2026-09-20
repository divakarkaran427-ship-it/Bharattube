const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

const {
    getAdminDashboard,
    getPendingMonetizations,
    approveMonetization,
    rejectMonetization,
} = require("../controllers/admin.controller");

router.get(
    "/dashboard",
    authMiddleware,
    adminMiddleware,
    getAdminDashboard
);

// Get Pending Applications
router.get(
    "/monetization/pending",
    authMiddleware,
    adminMiddleware,
    getPendingMonetizations
);

router.patch(
    "/monetization/:id/approve",
    authMiddleware,
    adminMiddleware,
    approveMonetization
);

router.patch(
    "/monetization/:id/reject",
    authMiddleware,
    adminMiddleware,
    rejectMonetization
);

module.exports = router;