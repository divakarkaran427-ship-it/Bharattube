const Comment = require("../models/comment.model");
const Video = require("../models/video.model");
const { createNotification } = require("../services/notification.service");

const populateComment = (comment) => comment && comment.toObject ? comment.toObject() : comment;

const buildNestedReplies = async (parentCommentId, videoId) => {
  const replies = await Comment.find({
    parentComment: parentCommentId,
    video: videoId,
  })
    .populate("user", "name profilePhoto")
    .sort({ createdAt: 1 })
    .lean();

  const nestedReplies = await Promise.all(
    replies.map(async (reply) => {
      const childReplies = await buildNestedReplies(reply._id, videoId);

      return {
        ...reply,
        replies: childReplies,
        repliesCount: childReplies.length,
        likesCount: reply.likesCount ?? reply.likes?.length ?? 0,
        dislikesCount: reply.dislikesCount ?? reply.dislikes?.length ?? 0,
      };
    })
  );

  return nestedReplies;
};

// ==========================
// Add Comment
// ==========================
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, parentComment } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const video = await Video.findById(id).populate("channel", "owner");

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const parent = parentComment
      ? await Comment.findOne({ _id: parentComment, video: id }).select("user")
      : null;

    if (parentComment && !parent) {
      return res.status(400).json({
        success: false,
        message: "Parent comment not found for this video",
      });
    }

    const comment = await Comment.create({
      video: id,
      user: req.user._id,
      text,
      parentComment: parentComment || null,
    });

    video.commentsCount += 1;
    await video.save();

    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $inc: { repliesCount: 1 },
      });
    }

    await createNotification({
      sender: req.user._id,
      receiver: parent?.user || video.channel?.owner,
      type: parent ? "reply" : "comment",
      message: parent ? `${req.user.name} replied to your comment` : `${req.user.name} commented on your video`,
      video: video._id,
      comment: comment._id,
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "name profilePhoto")
      .lean();

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: populatedComment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// Get Video Comments
// ==========================
const getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const comments = await Comment.find({
      video: id,
      parentComment: null,
    })
      .populate("user", "name profilePhoto")
      .sort({ createdAt: -1 })
      .lean();

    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await buildNestedReplies(comment._id, id);

        return {
          ...comment,
          replies,
          repliesCount: replies.length,
          likesCount: comment.likesCount ?? comment.likes?.length ?? 0,
          dislikesCount: comment.dislikesCount ?? comment.dislikes?.length ?? 0,
        };
      })
    );

    res.status(200).json({
      success: true,
      totalComments: commentsWithReplies.length,
      comments: commentsWithReplies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const toggleCommentLike = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const userId = req.user._id.toString();
    const hasLiked = comment.likes.some((user) => user.toString() === userId);

    if (hasLiked) {
      comment.likes = comment.likes.filter((user) => user.toString() !== userId);
      comment.likesCount = Math.max(comment.likes.length, 0);
    } else {
      comment.likes.push(req.user._id);
      comment.likesCount = comment.likes.length;
      comment.dislikes = comment.dislikes.filter((user) => user.toString() !== userId);
      comment.dislikesCount = Math.max(comment.dislikes.length, 0);
    }

    await comment.save();

    return res.status(200).json({
      success: true,
      message: hasLiked ? "Comment like removed" : "Comment liked",
      likesCount: comment.likesCount,
      dislikesCount: comment.dislikesCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const removeCommentLike = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const userId = req.user._id.toString();
    comment.likes = comment.likes.filter((user) => user.toString() !== userId);
    comment.likesCount = Math.max(comment.likes.length, 0);
    await comment.save();

    return res.status(200).json({
      success: true,
      message: "Comment like removed",
      likesCount: comment.likesCount,
      dislikesCount: comment.dislikesCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addComment,
  getComments,
  toggleCommentLike,
  removeCommentLike,
};
