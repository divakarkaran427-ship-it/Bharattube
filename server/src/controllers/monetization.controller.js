const Monetization = require("../models/monetization.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

// ==========================================
// Apply For Monetization
// ==========================================

const applyForMonetization = asyncHandler(async (req, res) => {

    const creatorId = req.user._id;

    const alreadyApplied = await Monetization.findOne({
        creator: creatorId,
    });

    if (alreadyApplied) {
        throw new ApiError(
            400,
            "You have already applied for monetization."
        );
    }

    const monetization = await Monetization.create({
        creator: creatorId,
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            monetization,
            "Monetization application submitted successfully."
        )
    );
});

// ==========================================
// Get Monetization Status
// ==========================================

const getMonetizationStatus = asyncHandler(async (req, res) => {

    const creatorId = req.user._id;

    const monetization = await Monetization.findOne({
        creator: creatorId,
    });

    if (!monetization) {
        throw new ApiError(
            404,
            "Monetization record not found."
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            monetization,
            "Monetization status fetched successfully."
        )
    );
});

module.exports = {
    applyForMonetization,
    getMonetizationStatus,
};