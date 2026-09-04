const CommunityPost = require("../models/communityPost.model");
const Channel = require("../models/channel.model");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const cloudinary = require("../config/cloudinary");


const createCommunityPost = asyncHandler(async (req, res) => {

    const {
        content,
        hashtags,
        visibility,
        poll
    } = req.body;

    const channel = await Channel.findOne({
        owner: req.user._id
    });

    if (!channel) {
        throw new ApiError(404, "Channel not found.");
    }

   const uploadToCloudinary = require("../utils/cloudinaryUpload");

const images = [];

if (req.files?.length) {

    for (const file of req.files) {

        const uploadedImage = await uploadToCloudinary(
            file.path,
            "bharattube/community"
        );

        images.push({
            url: uploadedImage.secure_url,
            publicId: uploadedImage.public_id,
        });

     }

     }

    const post = await CommunityPost.create({

        channel: channel._id,

        content,

        images,

        hashtags,

        visibility,

        poll

    });

    return res.status(201).json(

        new ApiResponse(
            201,
            post,
            "Community post created successfully."
        )

    );

});



const getAllCommunityPosts = asyncHandler(async (req, res) => {

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [posts, totalPosts] = await Promise.all([

        CommunityPost.find({ visibility: "public" })
            .populate({
                path: "channel",
                select: "channelName handle logo verified"
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

        CommunityPost.countDocuments({
            visibility: "public"
        })

    ]);

    return res.status(200).json(

        new ApiResponse(

            200,

            {
                posts,
                pagination: {

                    totalPosts,

                    currentPage: page,

                    totalPages: Math.ceil(totalPosts / limit),

                    hasNextPage: page * limit < totalPosts,

                    hasPrevPage: page > 1

                }

            },

            "Community posts fetched successfully."

        )

    );

});


const getCommunityPostById = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const post = await CommunityPost.findById(id)
        .populate({
            path: "channel",
            select: "channelName handle logo verified"
        })
        .lean();

    if (!post) {
        throw new ApiError(404, "Community post not found.");
    }

    return res.status(200).json(

        new ApiResponse(
            200,
            post,
            "Community post fetched successfully."
        )

    );

});


const updateCommunityPost = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const {
        content,
        hashtags,
        visibility,
        poll
    } = req.body;

    const channel = await Channel.findOne({
        owner: req.user._id
    }).lean();

    if (!channel) {
        throw new ApiError(404, "Channel not found.");
    }

    const post = await CommunityPost.findById(id);

    if (!post) {
        throw new ApiError(404, "Community post not found.");
    }

    if (post.channel.toString() !== channel._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to update this post."
        );
    }

    if (content !== undefined) {
        post.content = content;
    }

    if (hashtags !== undefined) {
        post.hashtags = hashtags;
    }

    if (visibility !== undefined) {
        post.visibility = visibility;
    }

    if (poll !== undefined) {
        post.poll = poll;
    }

    await post.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            post,
            "Community post updated successfully."
        )
    );

});

const deleteCommunityPost = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const channel = await Channel.findOne({
        owner: req.user._id
    }).lean();

    if (!channel) {
        throw new ApiError(404, "Channel not found.");
    }

    const post = await CommunityPost.findById(id);

    if (!post) {
        throw new ApiError(404, "Community post not found.");
    }

    if (post.channel.toString() !== channel._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to delete this post."
        );
    }

    // Delete images from Cloudinary
    if (post.images.length > 0) {

        await Promise.all(

            post.images.map((image) =>
                cloudinary.uploader.destroy(image.publicId)
            )

        );

    }

    await CommunityPost.findByIdAndDelete(id);

    return res.status(200).json(

        new ApiResponse(
            200,
            null,
            "Community post deleted successfully."
        )

    );

});
module.exports = {

    createCommunityPost,

    getAllCommunityPosts,

    getCommunityPostById,

    updateCommunityPost,

    deleteCommunityPost

};