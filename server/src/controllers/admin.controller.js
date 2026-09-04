const Monetization = require("../models/monetization.model");
const Wallet = require("../models/wallet.model");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// ==============================
// Get Pending Monetization Requests
// ==============================

const getPendingMonetizations = asyncHandler(async (req, res) => {
    const applications = await Monetization.find({
        status: "pending",
    }).populate("creator", "name username email");

    return res.status(200).json(
        new ApiResponse(
            200,
            applications,
            "Pending monetization applications fetched successfully."
        )
    );
});

// ==============================
// Approve Monetization
// ==============================

const approveMonetization = asyncHandler(async (req, res) => {

    const monetization = await Monetization.findById(req.params.id);

    if (!monetization) {
        throw new ApiError(
            404,
            "Monetization application not found."
        );
    }

    if (monetization.status === "approved") {
        throw new ApiError(
            400,
            "Application is already approved."
        );
    }

    monetization.status = "approved";
    monetization.approvedAt = new Date();

    await monetization.save();

    let wallet = await Wallet.findOne({
        creator: monetization.creator,
    });

    if (!wallet) {
        wallet = await Wallet.create({
            creator: monetization.creator,
        });
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                monetization,
                wallet,
            },
            "Monetization approved successfully."
        )
    );
});

// ==============================
// Reject Monetization
// ==============================

const rejectMonetization = asyncHandler(async (req, res) => {

    const { rejectionReason } = req.body;

    const monetization = await Monetization.findById(req.params.id);

    if (!monetization) {
        throw new ApiError(
            404,
            "Monetization application not found."
        );
    }

    if (monetization.status === "rejected") {
        throw new ApiError(
            400,
            "Application is already rejected."
        );
    }

    monetization.status = "rejected";
    monetization.rejectedAt = new Date();
    monetization.rejectionReason =
        rejectionReason || "Application rejected by admin.";

    await monetization.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            monetization,
            "Monetization rejected successfully."
        )
    );
});

module.exports = {
    getPendingMonetizations,
    approveMonetization,
    rejectMonetization,
};