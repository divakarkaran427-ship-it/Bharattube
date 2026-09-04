const Notification = require("../models/notification.model");

const createNotification = async ({ sender, receiver, type, message, video = null, comment = null }) => {
  if (!sender || !receiver || String(sender) === String(receiver)) return null;

  return Notification.create({
    sender,
    receiver,
    type,
    message,
    video,
    comment,
  });
};

const createNotifications = async ({ sender, receivers, type, message, video = null, comment = null }) => {
  const uniqueReceivers = [...new Set((receivers || []).map(String))]
    .filter((receiver) => receiver && receiver !== String(sender));

  if (!sender || uniqueReceivers.length === 0) return [];

  return Notification.insertMany(uniqueReceivers.map((receiver) => ({
    sender,
    receiver,
    type,
    message,
    video,
    comment,
  })), { ordered: false });
};

module.exports = {
  createNotification,
  createNotifications,
};
