import { useEffect, useMemo, useState } from "react";
import { FaLock, FaPlus, FaGlobe, FaCheck } from "react-icons/fa";
import playlistService from "../../services/playlist.service";
import "./PlaylistModal.css";

function PlaylistModal({ isOpen, onClose, videoId, onSaved }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState([]);
  const [newPlaylist, setNewPlaylist] = useState({ title: "", description: "", visibility: "private" });

  useEffect(() => {
    if (!isOpen) return;

    const loadPlaylists = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await playlistService.getMyPlaylists();
        setPlaylists(data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load playlists.");
      } finally {
        setLoading(false);
      }
    };

    loadPlaylists();
  }, [isOpen]);

  const playlistOptions = useMemo(() => playlists.map((playlist) => ({
    ...playlist,
    checked: selectedPlaylistIds.includes(playlist._id),
  })), [playlists, selectedPlaylistIds]);

  const togglePlaylist = (playlistId) => {
    setSelectedPlaylistIds((current) => current.includes(playlistId)
      ? current.filter((id) => id !== playlistId)
      : [...current, playlistId]);
  };

  const createNewPlaylist = async (event) => {
    event.preventDefault();

    if (!newPlaylist.title.trim()) {
      setError("Playlist title is required.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      const playlist = await playlistService.createPlaylist({
        title: newPlaylist.title.trim(),
        description: newPlaylist.description.trim(),
        visibility: newPlaylist.visibility,
      });

      setPlaylists((items) => [playlist, ...items]);
      setSelectedPlaylistIds((items) => [...items, playlist._id]);
      setNewPlaylist({ title: "", description: "", visibility: "private" });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create playlist.");
    } finally {
      setCreating(false);
    }
  };

  const saveToSelectedPlaylists = async () => {
    if (!videoId || selectedPlaylistIds.length === 0) {
      setError("Select at least one playlist.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await Promise.all(
        selectedPlaylistIds.map((playlistId) => playlistService.addVideo(playlistId, videoId))
      );

      onSaved?.();
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save this video.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="playlist-modal-backdrop" onClick={onClose}>
      <div className="playlist-modal" role="dialog" aria-modal="true" aria-label="Save to playlist" onClick={(event) => event.stopPropagation()}>
        <div className="playlist-modal-header">
          <div>
            <p className="playlist-modal-kicker">Save video</p>
            <h2>Choose playlists</h2>
          </div>
          <button type="button" className="playlist-modal-close" onClick={onClose} aria-label="Close playlist modal">×</button>
        </div>

        {error && <p className="playlist-modal-error" role="alert">{error}</p>}

        <div className="playlist-modal-list">
          {loading ? (
            <p className="playlist-modal-empty">Loading your playlists…</p>
          ) : playlistOptions.length > 0 ? (
            playlistOptions.map((playlist) => (
              <label key={playlist._id} className="playlist-modal-item">
                <input
                  type="checkbox"
                  checked={playlist.checked}
                  onChange={() => togglePlaylist(playlist._id)}
                />
                <span className="playlist-modal-item-main">
                  <strong>{playlist.title}</strong>
                  <small>{playlist.videoCount || 0} videos • {playlist.visibility}</small>
                </span>
                <span className="playlist-modal-item-icon">{playlist.visibility === "public" ? <FaGlobe /> : <FaLock />}</span>
              </label>
            ))
          ) : (
            <p className="playlist-modal-empty">No playlists yet. Create one below.</p>
          )}
        </div>

        <form className="playlist-modal-form" onSubmit={createNewPlaylist}>
          <label>
            <span>Playlist name</span>
            <input
              type="text"
              value={newPlaylist.title}
              onChange={(event) => setNewPlaylist((current) => ({ ...current, title: event.target.value }))}
              placeholder="My new playlist"
              maxLength="100"
            />
          </label>
          <label>
            <span>Description</span>
            <textarea
              rows="2"
              value={newPlaylist.description}
              onChange={(event) => setNewPlaylist((current) => ({ ...current, description: event.target.value }))}
              placeholder="Optional description"
              maxLength="1000"
            />
          </label>
          <label>
            <span>Visibility</span>
            <select
              value={newPlaylist.visibility}
              onChange={(event) => setNewPlaylist((current) => ({ ...current, visibility: event.target.value }))}
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </label>
          <button type="submit" className="playlist-modal-create" disabled={creating}>
            <FaPlus /> {creating ? "Creating…" : "Create new playlist"}
          </button>
        </form>

        <div className="playlist-modal-actions">
          <button type="button" className="playlist-modal-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="playlist-modal-save" onClick={saveToSelectedPlaylists} disabled={saving}>
            <FaCheck /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlaylistModal;
