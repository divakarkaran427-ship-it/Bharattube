const Video = require("../models/video.model");
const Channel = require("../models/channel.model");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// =========================
// CREATE CHANNEL
// =========================

const createChannel = asyncHandler(async (req, res) => {
  const { channelName, handle, description } = req.body;

  const existingChannel = await Channel.findOne({
    owner: req.user._id,
  });

  if (existingChannel) {
    throw new ApiError(400, "User already has a channel");
  }

  const cleanHandle = handle.toLowerCase().trim();

  const existingHandle = await Channel.findOne({
    handle: cleanHandle,
  });

  if (existingHandle) {
    throw new ApiError(400, "Handle already taken");
  }

  const channel = await Channel.create({
    owner: req.user._id,
    channelName: channelName.trim(),
    handle: cleanHandle,
    description: description?.trim() || "",
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      "Channel created successfully",
      channel
    )
  );
});

// =========================
// GET MY CHANNEL
// =========================

const getMyChannel = asyncHandler(async (req, res) => {
  const channel = await Channel.findOne({
    owner: req.user._id,
  }).populate("owner", "name email username profilePhoto");

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      "Channel fetched successfully",
      channel
    )
  );
});

// =========================
// UPDATE CHANNEL
// =========================

const updateChannel = asyncHandler(async (req, res) => {
  const {
    channelName,
    handle,
    description,
    logo,
    banner,
  } = req.body;

  const channel = await Channel.findOne({
    owner: req.user._id,
  });

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  // Update Channel Name
  if (channelName) {
    channel.channelName = channelName.trim();
  }

  // Update Handle
  if (handle) {
    const cleanHandle = handle.toLowerCase().trim();

    if (cleanHandle !== channel.handle) {
      const existingHandle = await Channel.findOne({
        handle: cleanHandle,
      });

      if (existingHandle) {
        throw new ApiError(400, "Handle already taken");
      }

      channel.handle = cleanHandle;
    }
  }

  // Update Description
  if (description !== undefined) {
    channel.description = description.trim();
  }

  // Update Logo
  if (logo) {
    channel.logo = logo;
  }

  // Update Banner
  if (banner) {
    channel.banner = banner;
  }

  await channel.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      "Channel updated successfully",
      channel
    )
  );
});

// =========================
// DELETE CHANNEL
// =========================

const deleteChannel = asyncHandler(async (req, res) => {
  const channel = await Channel.findOneAndDelete({
    owner: req.user._id,
  });

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      "Channel deleted successfully"
    )
  );
});

// =========================
// GET CHANNEL BY HANDLE
// =========================

const getChannelByHandle = asyncHandler(async (req, res) => {
  const { handle } = req.params;

  const channel = await Channel.findOne({
    handle: handle.toLowerCase(),
  })
    .populate("owner", "name username profilePhoto")
    .lean();

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      "Channel fetched successfully",
      {
        ...channel,
        subscribersCount: channel.subscribers.length,
      }
    )
  );
});

// =========================
// GET CHANNEL VIDEOS
// =========================

const getChannelVideos = asyncHandler(async (req, res) => {
  const { handle } = req.params;

  const channel = await Channel.findOne({
    handle: handle.toLowerCase(),
  });

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const videos = await Video.find({
    channel: channel._id,
    visibility: "public",
    isPublished: true,
  })
    .sort({
      createdAt: -1,
    })
    .populate({
      path: "channel",
      select: "channelName handle logo verified subscribers",
    });

  return res.status(200).json(
    new ApiResponse(
      200,
      "Channel videos fetched successfully",
      videos
    )
  );
});

const uploadToCloudinary = require("../utils/cloudinaryUpload");

// =========================
// UPDATE CHANNEL IMAGES
// =========================

const updateChannelImages = asyncHandler(async (req, res) => {

  const channel = await Channel.findOne({
    owner: req.user._id,
  });

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  // Upload Logo
  if (req.files?.logo?.[0]) {

    const result = await uploadToCloudinary(
      req.files.logo[0].path,
      "bharattube/channel/logo",
      "image"
    );

    channel.logo = result.secure_url;
  }

  // Upload Banner
  if (req.files?.banner?.[0]) {

    const result = await uploadToCloudinary(
      req.files.banner[0].path,
      "bharattube/channel/banner",
      "image"
    );

    channel.banner = result.secure_url;
  }

  await channel.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      "Channel images updated successfully",
      channel
    )
  );

});
module.exports = {
  createChannel,
  getMyChannel,
  updateChannel,
  deleteChannel,
  getChannelByHandle,
  getChannelVideos,
  updateChannelImages, // hona chahiye
};