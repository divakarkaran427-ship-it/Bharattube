import { useCallback, useEffect, useState } from "react";
import { FaClock, FaTrashAlt } from "react-icons/fa";
import watchLaterService from "../../services/watchLater.service";
import "./WatchLater.css";

function WatchLater() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState("");

  const loadWatchLater = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await watchLaterService.getMyWatchLater({ limit: 24 });
      setItems(data.items || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load Watch Later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWatchLater();
  }, [loadWatchLater]);

  const removeItem = async (videoId) => {
    try {
      setRemovingId(videoId);
      setError("");
      await watchLaterService.removeFromWatchLater(videoId);
      setItems((current) => current.filter((item) => item.video?._id !== videoId));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to remove this video.");
    } finally {
      setRemovingId("");
    }
  };

  return (
    <main className="watch-later-page">
      <header className="watch-later-header">
        <div>
          <p className="watch-later-kicker"><FaClock aria-hidden="true" /> Watch Later</p>
          <h1>Videos to watch later</h1>
          <p>Keep a personal queue of videos you want to revisit.</p>
        </div>
      </header>

      {error && <p className="watch-later-message" role="alert">{error}</p>}

      {loading ? (
        <section className="watch-later-state">Loading your Watch Later list…</section>
      ) : items.length > 0 ? (
        <section className="watch-later-grid" aria-label="Watch later videos">
          {items.map((item) => (
            <article className="watch-later-card" key={item._id}>
              <div className="watch-later-cover">
                {item.video?.thumbnail ? <img src={item.video.thumbnail} alt={item.video.title} /> : <FaClock aria-hidden="true" />}
              </div>
              <div className="watch-later-card-body">
                <h2>{item.video?.title || "Untitled video"}</h2>
                <p>{item.video?.channel?.channelName || "Unknown channel"}</p>
                <button type="button" onClick={() => removeItem(item.video?._id)} disabled={removingId === item.video?._id}>
                  <FaTrashAlt aria-hidden="true" /> {removingId === item.video?._id ? "Removing…" : "Remove"}
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="watch-later-state watch-later-state--empty">
          <FaClock aria-hidden="true" />
          <h2>No videos in Watch Later</h2>
          <p>Save a video from the menu to build your queue.</p>
        </section>
      )}
    </main>
  );
}

export default WatchLater;
