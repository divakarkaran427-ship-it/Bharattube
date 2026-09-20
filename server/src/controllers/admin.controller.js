const Monetization = require("../models/monetization.model");
const Wallet = require("../models/wallet.model");
const User = require("../models/user.model");
const Video = require("../models/video.model");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const getAdminDashboard = asyncHandler(async (req, res) => {
    const [totalUsers, totalVideos, totalShorts, viewTotals, recentUsers, recentVideos] =
        await Promise.all([
            User.countDocuments(),
            Video.countDocuments({ isShort: { $ne: true } }),
            Video.countDocuments({ isShort: true }),
            Video.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$views" },
                    },
                },
            ]),
            User.find()
                .select("name username createdAt")
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            Video.find()
                .select("title isShort createdAt")
                .populate("channel", "channelName")
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
        ]);

    const recentActivity = [
        ...recentUsers.map((user) => ({
            id: user._id,
            type: "user",
            title: user.name || user.username,
            detail: "New user joined",
            createdAt: user.createdAt,
        })),
        ...recentVideos.map((video) => ({
            id: video._id,
            type: video.isShort ? "short" : "video",
            title: video.title,
            detail: video.isShort ? "Short uploaded" : "Video uploaded",
            channelName: video.channel?.channelName || "Unknown channel",
            createdAt: video.createdAt,
        })),
    ]
        .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
        .slice(0, 8);

    return res.status(200).json({
        success: true,
        data: {
            stats: {
                totalUsers,
                totalVideos,
                totalShorts,
                totalViews: viewTotals[0]?.total || 0,
            },
            recentActivity,
            reports: {
                available: false,
                message: "Reports system not connected yet",
            },
        },
    });
});

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
    getAdminDashboard,
    getPendingMonetizations,
    approveMonetization,
    rejectMonetization,
};