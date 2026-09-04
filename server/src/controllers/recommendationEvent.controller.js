const Video = require("../models/video.model");
const VideoImpression = require("../models/videoImpression.model");

const ALLOWED_SURFACES = new Set(["home", "related", "search", "channel", "shorts"]);

const recordImpressions = async (req, res) => {
  try {
    const { sessionId, surface, impressions } = req.body;

    if (!ALLOWED_SURFACES.has(surface)) {
      return res.status(400).json({ success: false, message: "Invalid recommendation surface" });
    }

    if (!Array.isArray(impressions) || impressions.length === 0 || impressions.length > 50) {
      return res.status(400).json({ success: false, message: "Impressions must contain between 1 and 50 videos" });
    }

    if (!req.user && (!sessionId || sessionId.length > 100)) {
      return res.status(400).json({ success: false, message: "A valid sessionId is required for anonymous impressions" });
    }

    const videoIds = impressions.map((impression) => impression.videoId);
    const existingVideos = await Video.find({ _id: { $in: videoIds } }).select("_id").lean();
    const existingVideoIds = new Set(existingVideos.map((video) => String(video._id)));

    const validImpressions = impressions
      .filter((impression) => existingVideoIds.has(String(impression.videoId)) && Number.isInteger(impression.position) && impression.position >= 0)
      .map((impression) => ({
        user: req.user?._id || null,
        sessionId: sessionId || null,
        video: impression.videoId,
        surface,
        position: impression.position,
      }));

    if (validImpressions.length === 0) {
      return res.status(400).json({ success: false, message: "No valid video impressions were provided" });
    }

    const createdImpressions = await VideoImpression.insertMany(validImpressions, { ordered: false });

    return res.status(201).json({
      success: true,
      impressions: createdImpressions.map((impression) => ({
        id: impression._id,
        video: impression.video,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const recordClick = async (req, res) => {
  try {
    const { impressionId, sessionId } = req.body;

    if (!impressionId) {
      return res.status(400).json({ success: false, message: "impressionId is required" });
    }

    if (!req.user && (!sessionId || sessionId.length > 100)) {
      return res.status(400).json({ success: false, message: "A valid sessionId is required for anonymous clicks" });
    }

    const ownershipFilter = req.user ? { user: req.user._id } : { sessionId };

    const impression = await VideoImpression.findOneAndUpdate(
      { _id: impressionId, clickedAt: null, ...ownershipFilter },
      { clickedAt: new Date() },
      { new: true }
    );

    if (!impression) {
      return res.status(404).json({ success: false, message: "Active impression not found" });
    }

    return res.status(200).json({ success: true, impression });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  recordClick,
  recordImpressions,
};
