const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  createPlaylist,
  getMyPlaylists,
  getPlaylistById,
  getPublicPlaylists,
  updatePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
} = require("../controllers/playlist.controller");

// ==========================
// Create Playlist
// POST /api/v1/playlists
// ==========================
router.post("/", authMiddleware, createPlaylist);

// ==========================
// Get My Playlists
// GET /api/v1/playlists
// ==========================
router.get("/", authMiddleware, getMyPlaylists);

// ==========================
// Get Public Playlists
// GET /api/v1/playlists/public
// ==========================
router.get("/public", getPublicPlaylists);

// ==========================
// Get Playlist By Id
// GET /api/v1/playlists/:id
// ==========================
router.get("/:id", authMiddleware, getPlaylistById);

// ==========================
// Update Playlist
// PATCH /api/v1/playlists/:id
// ==========================
router.patch("/:id", authMiddleware, updatePlaylist);

// ==========================
// Add Video To Playlist
// POST /api/v1/playlists/:playlistId/videos/:videoId
// ==========================
router.post(
  "/:playlistId/videos/:videoId",
  authMiddleware,
  addVideoToPlaylist
);

// ==========================
// Remove Video From Playlist
// DELETE /api/v1/playlists/:playlistId/videos/:videoId
// ==========================
router.delete(
  "/:playlistId/videos/:videoId",
  authMiddleware,
  removeVideoFromPlaylist
);

// ==========================
// Delete Playlist
// DELETE /api/v1/playlists/:id
// ==========================
router.delete("/:id", authMiddleware, deletePlaylist);

module.exports = router;