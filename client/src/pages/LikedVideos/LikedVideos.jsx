import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaPlay } from "react-icons/fa";
import reactionService from "../../services/reaction.service";
import "./LikedVideos.css";

function LikedVideos() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLikedVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await reactionService.getLikedVideos();
      setVideos(data.videos || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load liked videos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLikedVideos();
  }, [loadLikedVideos]);

  return (
    <main className="liked-videos-page">
      <header className="liked-videos-header">
        <div>
          <p className="liked-videos-kicker"><FaHeart aria-hidden="true" /> Liked Videos</p>
          <h1>Your liked collection</h1>
          <p>All videos you have liked appear here.</p>
        </div>
      </header>

      {error && <p className="liked-videos-message" role="alert">{error}</p>}

      {loading ? (
        <section className="liked-videos-state">Loading your liked videos…</section>
      ) : videos.length > 0 ? (
        <section className="liked-videos-grid" aria-label="Liked videos">
          {videos.map((video) => (
            <article className="liked-video-card" key={video._id}>
              <button type="button" className="liked-video-cover" onClick={() => navigate(`/watch/${video._id}`)}>
                <img src={video.thumbnail} alt={video.title} />
                <span className="liked-video-play"><FaPlay aria-hidden="true" /></span>
              </button>
              <div className="liked-video-body">
                <h2>{video.title}</h2>
                <p>{video.channel?.channelName || "Unknown channel"}</p>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="liked-videos-state liked-videos-state--empty">
          <FaHeart aria-hidden="true" />
          <h2>No liked videos yet</h2>
          <p>Like any video from the watch page to see it here.</p>
        </section>
      )}
    </main>
  );
}

export default LikedVideos;
