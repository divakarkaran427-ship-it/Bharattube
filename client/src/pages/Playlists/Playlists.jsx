import { useCallback, useEffect, useState } from "react";
import { FaList, FaLock, FaPlus, FaTrashAlt } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import playlistService from "../../services/playlist.service";
import "./Playlists.css";

function Playlists() {
  const [searchParams] = useSearchParams();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", visibility: "private" });
  const [savingVideoTo, setSavingVideoTo] = useState("");
  const videoIdToSave = searchParams.get("video");

  const loadPlaylists = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setPlaylists(await playlistService.getMyPlaylists());
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load your playlists.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const createPlaylist = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    try {
      setSaving(true);
      setError("");
      const playlist = await playlistService.createPlaylist({ ...form, title: form.title.trim(), description: form.description.trim() });
      setPlaylists((items) => [playlist, ...items]);
      setForm({ title: "", description: "", visibility: "private" });
      setShowCreateForm(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create playlist.");
    } finally {
      setSaving(false);
    }
  };

  const deletePlaylist = async (playlistId) => {
    try {
      setDeletingId(playlistId);
      setError("");
      await playlistService.deletePlaylist(playlistId);
      setPlaylists((items) => items.filter((playlist) => playlist._id !== playlistId));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete this playlist.");
    } finally {
      setDeletingId("");
    }
  };

  const addVideoToPlaylist = async (playlistId) => {
    if (!videoIdToSave) return;

    try {
      setSavingVideoTo(playlistId);
      setError("");
      const updatedPlaylist = await playlistService.addVideo(playlistId, videoIdToSave);
      setPlaylists((items) => items.map((playlist) => (
        playlist._id === playlistId ? updatedPlaylist : playlist
      )));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save this video to the playlist.");
    } finally {
      setSavingVideoTo("");
    }
  };

  return (
    <main className="playlists-page">
      <header className="playlists-header">
        <div><p><FaList aria-hidden="true" /> Library</p><h1>Your Playlists</h1><span>Create and manage collections from the videos you save.</span></div>
        <button type="button" onClick={() => setShowCreateForm((visible) => !visible)}><FaPlus aria-hidden="true" /> New playlist</button>
      </header>

      {showCreateForm && (
        <form className="playlist-form" onSubmit={createPlaylist}>
          <label>Title<input value={form.title} onChange={(event) => setForm((values) => ({ ...values, title: event.target.value }))} maxLength="100" required /></label>
          <label>Description<textarea value={form.description} onChange={(event) => setForm((values) => ({ ...values, description: event.target.value }))} maxLength="1000" rows="3" /></label>
          <label>Visibility<select value={form.visibility} onChange={(event) => setForm((values) => ({ ...values, visibility: event.target.value }))}><option value="private">Private</option><option value="public">Public</option></select></label>
          <div><button type="button" onClick={() => setShowCreateForm(false)}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Creating…" : "Create playlist"}</button></div>
        </form>
      )}

      {error && <p className="playlists-message" role="alert">{error}</p>}
      {videoIdToSave && <p className="playlists-save-hint">Choose a playlist below to save the selected video.</p>}
      {loading ? <section className="playlists-state" role="status">Loading your playlists…</section> : playlists.length ? (
        <section className="playlist-grid" aria-label="Your playlists">
          {playlists.map((playlist) => {
            const firstVideo = playlist.videos?.[0];
            return <article className="playlist-card" key={playlist._id}>
              <div className="playlist-cover">{firstVideo?.thumbnail ? <img src={firstVideo.thumbnail} alt="" /> : <FaList aria-hidden="true" />}<span>{playlist.videos?.length || 0} videos</span></div>
              <div><h2>{playlist.title}</h2><p>{playlist.description || "No description"}</p><small>{playlist.visibility === "private" && <FaLock aria-hidden="true" />} {playlist.visibility}</small>{videoIdToSave && <button type="button" className="playlist-add-video" onClick={() => addVideoToPlaylist(playlist._id)} disabled={savingVideoTo === playlist._id}>{savingVideoTo === playlist._id ? "Saving…" : "Save video here"}</button>}</div>
              <button type="button" onClick={() => deletePlaylist(playlist._id)} disabled={deletingId === playlist._id} aria-label={`Delete ${playlist.title}`}><FaTrashAlt aria-hidden="true" /></button>
            </article>;
          })}
        </section>
      ) : <section className="playlists-state playlists-state--empty"><FaList aria-hidden="true" /><h2>No playlists yet</h2><p>Create a playlist, then use Save on a video to add it.</p></section>}
    </main>
  );
}

export default Playlists;
