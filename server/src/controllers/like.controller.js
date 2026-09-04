const Video = require("../models/video.model");
const { createNotification } = require("../services/notification.service");

// ==========================
// Like / Dislike Video
// ==========================

const reactToVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (!["like", "dislike"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be like or dislike",
      });
    }

    const video = await Video.findById(id).populate("channel", "owner");

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const userId = req.user._id.toString();

    const liked = video.likes.some(
      (user) => user.toString() === userId
    );

    const disliked = video.dislikes.some(
      (user) => user.toString() === userId
    );

    // ==========================
    // LIKE
    // ==========================

    if (type === "like") {

      if (liked) {
        return res.status(200).json({
          success: true,
          message: "Video already liked",
        });
      }

      // Remove dislike if exists
      video.dislikes = video.dislikes.filter(
        (user) => user.toString() !== userId
      );

      video.likes.push(req.user._id);
    }

    // ==========================
    // DISLIKE
    // ==========================

    if (type === "dislike") {

      if (disliked) {
        return res.status(200).json({
          success: true,
          message: "Video already disliked",
        });
      }

      // Remove like if exists
      video.likes = video.likes.filter(
        (user) => user.toString() !== userId
      );

      video.dislikes.push(req.user._id);
    }

    await video.save();

    if (type === "like" && !liked) {
      await createNotification({
        sender: req.user._id,
        receiver: video.channel?.owner,
        type: "like",
        message: `${req.user.name} liked your video`,
        video: video._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reaction updated successfully",
      likes: video.likes.length,
      dislikes: video.dislikes.length,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ==========================
// Remove Reaction
// ==========================

const removeReaction = async (req, res) => {
  try {

    const { id } = req.params;

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const userId = req.user._id.toString();

    video.likes = video.likes.filter(
      (user) => user.toString() !== userId
    );

    video.dislikes = video.dislikes.filter(
      (user) => user.toString() !== userId
    );

    await video.save();

    return res.status(200).json({
      success: true,
      message: "Reaction removed successfully",
      likes: video.likes.length,
      dislikes: video.dislikes.length,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

module.exports = {
  reactToVideo,
  removeReaction,
};
