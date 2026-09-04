const Channel = require("../models/channel.model");
const Comment = require("../models/comment.model");
const Like = require("../models/like.model");
const UserInterest = require("../models/userInterest.model");
const Video = require("../models/video.model");
const WatchHistory = require("../models/watchHistory.model");

const addScore = (scores, key, value) => {
  if (!key || !Number.isFinite(value)) return;
  scores.set(String(key), (scores.get(String(key)) || 0) + value);
};

const getRecencyWeight = (date) => {
  if (!date) return 1;
  const ageInDays = Math.max(0, (Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000));
  return Math.exp(-ageInDays / 30);
};

const scoreVideoInterest = (video, weight, categoryScores, tagScores, channelScores) => {
  if (!video) return;

  addScore(categoryScores, video.category, weight * 2);
  addScore(channelScores, video.channel, weight * 1.5);

  (video.tags || []).forEach((tag) => {
    addScore(tagScores, tag.toLowerCase(), weight);
  });
};

const rebuildUserInterest = async (userId) => {
  const [history, reactions, comments, subscriptions] = await Promise.all([
    WatchHistory.find({ user: userId })
      .sort({ lastWatchedAt: -1 })
      .limit(200)
      .populate("video", "category tags channel duration"),
    Like.find({ user: userId, targetType: "video" }).lean(),
    Comment.find({ user: userId }).select("video").lean(),
    Channel.find({ subscribers: userId }).select("_id").lean(),
  ]);

  const reactionVideoIds = reactions.map((reaction) => reaction.targetId);
  const commentedVideoIds = comments.map((comment) => comment.video);
  const interactedVideos = await Video.find({
    _id: { $in: [...reactionVideoIds, ...commentedVideoIds] },
  }).select("category tags channel").lean();
  const videosById = new Map(interactedVideos.map((video) => [String(video._id), video]));

  const categoryScores = new Map();
  const tagScores = new Map();
  const channelScores = new Map();

  history.forEach((entry) => {
    const video = entry.video;
    if (!video) return;

    const completionRate = video.duration > 0
      ? Math.min(entry.watchedDuration / video.duration, 1)
      : 0;
    const completionBonus = entry.completed ? 1 : 0;
    const weight = (0.5 + completionRate * 2 + completionBonus) * getRecencyWeight(entry.lastWatchedAt);

    scoreVideoInterest(video, weight, categoryScores, tagScores, channelScores);
  });

  reactions.forEach((reaction) => {
    const video = videosById.get(String(reaction.targetId));
    const weight = reaction.reaction === "like" ? 4 : -3;
    scoreVideoInterest(video, weight, categoryScores, tagScores, channelScores);
  });

  comments.forEach((comment) => {
    const video = videosById.get(String(comment.video));
    scoreVideoInterest(video, 1.5, categoryScores, tagScores, channelScores);
  });

  subscriptions.forEach((channel) => {
    addScore(channelScores, channel._id, 5);
  });

  return UserInterest.findOneAndUpdate(
    { user: userId },
    {
      categoryScores: Object.fromEntries(categoryScores),
      tagScores: Object.fromEntries(tagScores),
      channelScores: Object.fromEntries(channelScores),
      lastCalculatedAt: new Date(),
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const getUserInterest = async (userId) => UserInterest.findOne({ user: userId }).lean();

module.exports = {
  getUserInterest,
  rebuildUserInterest,
};
