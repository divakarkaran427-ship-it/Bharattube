const Feedback = require("../models/feedback.model");

const createFeedback = async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject?.trim() || !message?.trim()) return res.status(400).json({ success: false, message: "Subject and feedback message are required" });
    const feedback = await Feedback.create({ user: req.user._id, subject, message });
    return res.status(201).json({ success: true, feedback });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createFeedback };
