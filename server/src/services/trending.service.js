const HOURS_IN_MILLISECOND = 60 * 60 * 1000;

const getHoursSincePublished = (createdAt) => {
  if (!createdAt) return 0;
  return Math.max(0, (Date.now() - new Date(createdAt).getTime()) / HOURS_IN_MILLISECOND);
};

const calculateFreshnessScore = (createdAt) => {
  const ageInHours = getHoursSincePublished(createdAt);
  return Math.exp(-ageInHours / 168);
};

const calculateTrendingScore = (video, { channelSubscribers = 0, ctr = 0 } = {}) => {
  const likes = video.likesCount ?? video.likes?.length ?? 0;
  const comments = video.commentsCount ?? 0;
  const views = video.views ?? 0;
  const freshness = calculateFreshnessScore(video.createdAt);
  const engagementRate = (likes + comments * 2) / Math.max(views, 1);
  const audienceScore = Math.log10(channelSubscribers + 1);

  return (
    Math.log10(views + 1) * 4 +
    engagementRate * 20 +
    freshness * 5 +
    audienceScore * 0.5 +
    Math.max(ctr, 0) * 3
  );
};

module.exports = {
  calculateFreshnessScore,
  calculateTrendingScore,
};
