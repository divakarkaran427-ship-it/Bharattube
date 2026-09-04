const Playlist = require("../models/playlist.model");
const Video = require("../models/video.model");

const populatePlaylist = async (playlistId) => {
  const playlist = await Playlist.findById(playlistId)
    .populate({
      path: "videos",
      select: "title thumbnail duration visibility category description channel",
      populate: {
        path: "channel",
        select: "channelName handle logo",
      },
    })
    .populate({
      path: "owner",
      select: "name username profilePhoto",
    })
    .lean();

  if (!playlist) return null;

  const videos = Array.isArray(playlist.videos) ? playlist.videos : [];
  const totalDuration = videos.reduce((sum, video) => sum + Number(video.duration || 0), 0);

  return {
    ...playlist,
    totalDuration,
    videoCount: videos.length,
    thumbnail: playlist.thumbnail || videos[0]?.thumbnail || "",
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
  };
};

const createPlaylist = async (req, res) => {
  try {
    const { title, description = "", visibility = "private" } = req.body;

    const safeTitle = String(title || "").trim();
    const safeDescription = String(description || "").trim();

    if (!safeTitle) {
      return res.status(400).json({
        success: false,
        message: "Playlist title is required",
      });
    }

    const playlist = await Playlist.create({
      owner: req.user._id,
      title: safeTitle,
      description: safeDescription,
      visibility,
    });

    const populatedPlaylist = await populatePlaylist(playlist._id);

    return res.status(201).json({
      success: true,
      message: "Playlist created successfully",
      playlist: populatedPlaylist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "videos",
        select: "title thumbnail duration",
      })
      .lean();

    const enrichedPlaylists = playlists.map((playlist) => {
      const videos = Array.isArray(playlist.videos) ? playlist.videos : [];
      return {
        ...playlist,
        videoCount: videos.length,
        totalDuration: videos.reduce((sum, video) => sum + Number(video.duration || 0), 0),
        thumbnail: playlist.thumbnail || videos[0]?.thumbnail || "",
      };
    });

    return res.status(200).json({
      success: true,
      total: enrichedPlaylists.length,
      playlists: enrichedPlaylists,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getPlaylistById = async (req, res) => {
  try {
    const { id } = req.params;
    const playlist = await populatePlaylist(id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    if (playlist.visibility !== "public" && playlist.owner?._id?.toString() !== req.user?._id?.toString()) {
      return res.status(403).json({
        success: false,
        message: "This playlist is private",
      });
    }

    return res.status(200).json({
      success: true,
      playlist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getPublicPlaylists = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const page = Math.max(Number(req.query.page) || 1, 1);

    const [playlists, total] = await Promise.all([
      Playlist.find({ visibility: "public" })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: "owner", select: "name username profilePhoto" })
        .populate({ path: "videos", select: "title thumbnail duration" })
        .lean(),
      Playlist.countDocuments({ visibility: "public" }),
    ]);

    const enrichedPlaylists = playlists.map((playlist) => {
      const videos = Array.isArray(playlist.videos) ? playlist.videos : [];
      return {
        ...playlist,
        videoCount: videos.length,
        totalDuration: videos.reduce((sum, video) => sum + Number(video.duration || 0), 0),
        thumbnail: playlist.thumbnail || videos[0]?.thumbnail || "",
      };
    });

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      playlists: enrichedPlaylists,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updatePlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, visibility } = req.body;

    const playlist = await Playlist.findById(id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (title !== undefined) playlist.title = String(title).trim();
    if (description !== undefined) playlist.description = String(description).trim();
    if (visibility !== undefined) playlist.visibility = visibility;

    if (!playlist.title) {
      return res.status(400).json({
        success: false,
        message: "Playlist title is required",
      });
    }

    await playlist.save();
    const updatedPlaylist = await populatePlaylist(playlist._id);

    return res.status(200).json({
      success: true,
      message: "Playlist updated successfully",
      playlist: updatedPlaylist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const addVideoToPlaylist = async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const alreadyExists = playlist.videos.some((id) => id.toString() === videoId);
    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Video already exists in playlist",
      });
    }

    playlist.videos.push(videoId);

    if (!playlist.thumbnail) {
      playlist.thumbnail = video.thumbnail || "";
    }

    await playlist.save();
    const enrichedPlaylist = await populatePlaylist(playlist._id);

    return res.status(200).json({
      success: true,
      message: "Video added successfully",
      playlist: enrichedPlaylist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const removeVideoFromPlaylist = async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const hasVideo = playlist.videos.some((id) => id.toString() === videoId);
    if (!hasVideo) {
      return res.status(404).json({
        success: false,
        message: "Video not found in playlist",
      });
    }

    playlist.videos = playlist.videos.filter((id) => id.toString() !== videoId);
    await playlist.save();

    const enrichedPlaylist = await populatePlaylist(playlist._id);

    return res.status(200).json({
      success: true,
      message: "Video removed successfully",
      playlist: enrichedPlaylist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deletePlaylist = async (req, res) => {
  try {
    const { id } = req.params;

    const playlist = await Playlist.findById(id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await playlist.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Playlist deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPlaylist,
  getMyPlaylists,
  getPlaylistById,
  getPublicPlaylists,
  updatePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
};