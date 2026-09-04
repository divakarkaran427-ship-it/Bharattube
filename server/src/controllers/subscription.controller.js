const Channel = require("../models/channel.model");
const { createNotification } = require("../services/notification.service");

// ==========================
// Subscribe / Unsubscribe
// ==========================
const toggleSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const channel = await Channel.findById(id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // User cannot subscribe to own channel
    if (channel.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot subscribe to your own channel",
      });
    }

    const userId = req.user._id.toString();

    const isSubscribed = channel.subscribers.some(
      (subscriber) => subscriber.toString() === userId
    );

    // ==========================
    // Unsubscribe
    // ==========================
    if (isSubscribed) {
      channel.subscribers = channel.subscribers.filter(
        (subscriber) => subscriber.toString() !== userId
      );

      await channel.save();

      return res.status(200).json({
        success: true,
        message: "Channel unsubscribed successfully",
        subscribers: channel.subscribers.length,
        isSubscribed: false,
      });
    }

    // ==========================
    // Subscribe
    // ==========================
    channel.subscribers.push(req.user._id);

    await channel.save();

    await createNotification({
      sender: req.user._id,
      receiver: channel.owner,
      type: "subscribe",
      message: `${req.user.name} subscribed to your channel`,
    });

    return res.status(200).json({
      success: true,
      message: "Channel subscribed successfully",
      subscribers: channel.subscribers.length,
      isSubscribed: true,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// Get Subscribers
// ==========================
const getSubscribers = async (req, res) => {
  try {
    const { id } = req.params;

    const channel = await Channel.findById(id).populate(
      "subscribers",
      "name username profilePhoto"
    );

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // ⭐ req.user exist karta hai tabhi check karo
    const isSubscribed = req.user
      ? channel.subscribers.some(
          (subscriber) =>
            subscriber._id.toString() === req.user._id.toString()
        )
      : false;

    return res.status(200).json({
      success: true,
      totalSubscribers: channel.subscribers.length,
      subscribers: channel.subscribers,
      isSubscribed,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  toggleSubscription,
  getSubscribers,
};
