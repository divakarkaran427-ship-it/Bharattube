const Video = require("../models/video.model");
const VideoImpression = require("../models/videoImpression.model");
const WatchHistory = require("../models/watchHistory.model");
const { getUserInterest, rebuildUserInterest } = require("./interestProfile.service");
const { calculateTrendingScore } = require("./trending.service");

const getScore = (scores, key) => {
  if (!scores || !key) return 0;
  if (typeof scores.get === "function") return Number(scores.get(String(key))) || 0;
  return Number(scores[String(key)]) || 0;
};

const getCtrByVideo = async (videoIds) => {
  if (videoIds.length === 0) return new Map();

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const metrics = await VideoImpression.aggregate([
    { $match: { video: { $in: videoIds }, createdAt: { $gte: since } } },
    {
      $group: {
        _id: "$video",
        impressions: { $sum: 1 },
        clicks: { $sum: { $cond: [{ $ne: ["$clickedAt", null] }, 1, 0] } },
      },
    },
  ]);

  return new Map(metrics.map((metric) => [
    String(metric._id),
    metric.impressions > 0 ? metric.clicks / metric.impressions : 0,
  ]));
};

const calculateInterestScore = (video, interest) => {
  const categoryScore = getScore(interest.categoryScores, video.category);
  const channelScore = getScore(interest.channelScores, video.channel?._id || video.channel);
  const tagScore = (video.tags || []).reduce(
    (total, tag) => total + getScore(interest.tagScores, tag.toLowerCase()),
    0
  );

  return categoryScore * 1.4 + tagScore * 0.4 + channelScore * 1.6;
};

const getRecommendationReason = (video, interest) => {
  if (getScore(interest.channelScores, video.channel?._id || video.channel) > 0) {
    return "channel_affinity";
  }

  if (getScore(interest.categoryScores, video.category) > 0) {
    return "category_affinity";
  }

  return "trending";
};

const diversifyVideos = (videos, limit) => {
  const videosPerChannel = new Map();
  const recommendations = [];

  for (const video of videos) {
    const channelId = String(video.channel?._id || video.channel);
    const count = videosPerChannel.get(channelId) || 0;

    if (count >= 3) continue;

    videosPerChannel.set(channelId, count + 1);
    recommendations.push(video);

    if (recommendations.length === limit) break;
  }

  return recommendations;
};

const getPersonalizedFeed = async ({ userId, limit = 20 }) => {
  const boundedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const watchedHistory = await WatchHistory.find({
    user: userId,
    completed: true,
  })
    .sort({ lastWatchedAt: -1 })
    .limit(150)
    .select("video");
  const watchedVideoIds = watchedHistory.map((item) => item.video);

  let interest = await getUserInterest(userId);
  if (!interest) interest = await rebuildUserInterest(userId).then((profile) => profile.toObject());

  let candidates = await Video.find({
    _id: { $nin: watchedVideoIds },
    visibility: "public",
    isPublished: true,
  })
    .populate("channel", "channelName handle logo subscribers")
    .sort({ createdAt: -1 })
    .limit(250);

  if (candidates.length < boundedLimit) {
    candidates = await Video.find({
      visibility: "public",
      isPublished: true,
    })
      .populate("channel", "channelName handle logo subscribers")
      .sort({ createdAt: -1 })
      .limit(250);
  }

  const ctrByVideo = await getCtrByVideo(candidates.map((video) => video._id));
  const scoredVideos = candidates.map((video) => {
    const plainVideo = video.toObject();
    const ctr = ctrByVideo.get(String(video._id)) || 0;
    const channelSubscribers = video.channel?.subscribers?.length || 0;
    const interestScore = calculateInterestScore(video, interest);
    const trendingScore = calculateTrendingScore(video, { channelSubscribers, ctr });

    return {
      ...plainVideo,
      recommendationScore: interestScore + trendingScore,
      recommendationReason: getRecommendationReason(video, interest),
    };
  });

  scoredVideos.sort((first, second) => second.recommendationScore - first.recommendationScore);

  return diversifyVideos(scoredVideos, boundedLimit);
};

module.exports = {
  getPersonalizedFeed,
};
