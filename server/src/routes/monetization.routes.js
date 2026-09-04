const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
    applyForMonetization,
    getMonetizationStatus,
} = require("../controllers/monetization.controller");

// Apply For Monetization
router.post(
    "/apply",
    authMiddleware,
    applyForMonetization
);

// Get Monetization Status
router.get(
    "/status",
    authMiddleware,
    getMonetizationStatus
);

module.exports = router;