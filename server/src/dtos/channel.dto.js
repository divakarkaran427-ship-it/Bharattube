const channelDTO = (channel) => {
  return {
    id: channel._id,

    channelName: channel.channelName,

    handle: channel.handle,

    logo: channel.logo,

    banner: channel.banner,

    description: channel.description,

    verified: channel.verified,

    isMonetized: channel.isMonetized,

    totalViews: channel.totalViews,

    totalVideos: channel.totalVideos,

    subscribersCount: channel.subscribers
      ? channel.subscribers.length
      : 0,

    owner: channel.owner,
  };
};

module.exports = channelDTO;