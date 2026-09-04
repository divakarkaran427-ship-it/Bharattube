import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaClock, FaList, FaLock, FaTrashAlt } from "react-icons/fa";
import playlistService from "../../services/playlist.service";
import "./PlaylistDetail.css";

function PlaylistDetail() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingVideoId, setRemovingVideoId] = useState("");

  const loadPlaylist = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await playlistService.getPlaylistById(id);
      setPlaylist(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load playlist.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPlaylist();
  }, [loadPlaylist]);

  const removeVideo = async (videoId) => {
    try {
      setRemovingVideoId(videoId);
      setError("");
      const updated = await playlistService.removeVideo(playlist._id, videoId);
      setPlaylist(updated);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to remove this video.");
    } finally {
      setRemovingVideoId("");
    }
  };

  if (loading) {
    return <main className="playlist-detail-page"><section className="playlist-detail-state">Loading playlist…</section></main>;
  }

  if (error || !playlist) {
    return <main className="playlist-detail-page"><section className="playlist-detail-state playlist-detail-state--error">{error || "Playlist unavailable."}</section></main>;
  }

  const totalDuration = playlist.videos?.reduce((sum, video) => sum + Number(video.duration || 0), 0) || 0;

  return (
    <main className="playlist-detail-page">
      <section className="playlist-detail-hero">
        <div className="playlist-detail-cover">
          {playlist.thumbnail ? <img src={playlist.thumbnail} alt={playlist.title} /> : <FaList aria-hidden="true" />}
        </div>
        <div className="playlist-detail-meta">
          <p className="playlist-detail-kicker">Playlist</p>
          <h1>{playlist.title}</h1>
          <p>{playlist.description || "No description provided."}</p>
          <div className="playlist-detail-stats">
            <span>{playlist.owner?.name || "Unknown owner"}</span>
            <span>{playlist.videoCount || playlist.videos?.length || 0} videos</span>
            <span>{Math.floor(totalDuration / 60)} min total</span>
            <span>{playlist.createdAt ? new Date(playlist.createdAt).toLocaleDateString() : ""}</span>
            <span>{playlist.visibility === "private" ? <FaLock aria-hidden="true" /> : null} {playlist.visibility}</span>
          </div>
        </div>
      </section>

      <section className="playlist-detail-list">
        {playlist.videos?.length > 0 ? (
          playlist.videos.map((video) => (
            <article className="playlist-detail-item" key={video._id}>
              <div className="playlist-detail-thumb">
                <img src={video.thumbnail} alt={video.title} />
              </div>
              <div className="playlist-detail-item-body">
                <h2>{video.title}</h2>
                <p>{video.channel?.channelName || "Unknown channel"}</p>
                <button type="button" onClick={() => removeVideo(video._id)} disabled={removingVideoId === video._id}>
                  <FaTrashAlt aria-hidden="true" /> {removingVideoId === video._id ? "Removing…" : "Remove"}
                </button>
              </div>
              <div className="playlist-detail-duration">
                <FaClock aria-hidden="true" />
                <span>{Math.floor(Number(video.duration || 0) / 60)} min</span>
              </div>
            </article>
          ))
        ) : (
          <div className="playlist-detail-state playlist-detail-state--empty">No videos in this playlist yet.</div>
        )}
      </section>
    </main>
  );
}

export default PlaylistDetail;
