const Like = require("../models/like.model");
const Video = require("../models/video.model");
const CommunityPost = require("../models/communityPost.model");
const Comment = require("../models/comment.model");

const updateTargetCounter = async (
  targetType,
  targetId,
  reaction,
  value
) => {
  let Model;

  switch (targetType) {
    case "video":
    case "short":
      Model = Video;
      break;

    case "community":
      Model = CommunityPost;
      break;

    case "comment":
      Model = Comment;
      break;

    default:
      throw new Error("Invalid target type");
  }

  const update = {
    $inc: reaction === "like"
      ? { likesCount: value }
      : { dislikesCount: value },
  };

  await Model.findByIdAndUpdate(targetId, update);
};

const toggleReaction = async ({
  userId,
  targetType,
  targetId,
  reaction,
}) => {
  const existingReaction = await Like.findOne({
    user: userId,
    targetType,
    targetId,
  });

  // Same reaction → remove it
  if (existingReaction && existingReaction.reaction === reaction) {
    await Like.findByIdAndDelete(existingReaction._id);

    await updateTargetCounter(
      targetType,
      targetId,
      reaction,
      -1
    );

    return {
      reacted: false,
      reaction: null,
    };
  }

  // Switch reaction
  if (existingReaction) {
    await updateTargetCounter(
      targetType,
      targetId,
      existingReaction.reaction,
      -1
    );

    existingReaction.reaction = reaction;
    await existingReaction.save();

    await updateTargetCounter(
      targetType,
      targetId,
      reaction,
      1
    );

    return {
      reacted: true,
      reaction,
    };
  }

  // First reaction
  await Like.create({
    user: userId,
    targetType,
    targetId,
    reaction,
  });

  await updateTargetCounter(
    targetType,
    targetId,
    reaction,
    1
  );

  return {
    reacted: true,
    reaction,
  };
};

module.exports = {
  toggleReaction,
};