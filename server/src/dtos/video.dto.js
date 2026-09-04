const videoDTO = (video) => {
  return {
    id: video._id,

    title: video.title,

    description: video.description,

    thumbnail: video.thumbnail,

    duration: video.duration,

    category: video.category,

    language: video.language,

    tags: video.tags,

    views: video.views,

    likesCount: video.likesCount,

    dislikesCount: video.dislikesCount,

    commentsCount: video.commentsCount,

    createdAt: video.createdAt,

    isShort: video.isShort,

    aspectRatio: video.aspectRatio,

    channel: video.channel,
  };
};

module.exports = videoDTO;