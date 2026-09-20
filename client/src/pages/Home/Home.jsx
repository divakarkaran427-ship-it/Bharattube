import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import VideoGrid from "../../components/VideoGrid/VideoGrid";
import { useAuth } from "../../context/AuthContext";
import recommendationService from "../../services/recommendation.service";
import videoService from "../../services/video.service";
import ShortsShelf from "../../components/ShortsShelf/ShortsShelf";
import { FaRedo } from "react-icons/fa";
import "./Home.css";

const CATEGORIES = [
  "All", "Music", "Gaming", "News", "Sports",
  "Education", "Comedy", "Technology", "Entertainment", "Other",
];

function Home() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [retryKey, setRetryKey] = useState(0);

  const search = searchParams.get("search") || "";
  const shouldUsePersonalizedFeed = Boolean(user) && !search && activeCategory === "All";

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError("");

        let feedVideos = [];

        if (shouldUsePersonalizedFeed) {
          try {
            feedVideos = await recommendationService.getPersonalizedFeed(12);
          } catch (personalizationError) {
            console.warn("Personalized feed unavailable; loading standard feed instead.", personalizationError);
          }
        }

        if (feedVideos.length === 0) {
          const data = await videoService.getVideos({
            page: 1,
            limit: 12,
            search,
            category: activeCategory === "All" ? "" : activeCategory,
          });

          feedVideos = data.videos || [];
        }

        setVideos(feedVideos);
      } catch (err) {
        console.error(err);
        setError("Failed to load videos");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [search, activeCategory, shouldUsePersonalizedFeed, retryKey]);

  const longVideos = videos.filter((video) => video.isShort !== true);

  return (
    <div className="home-page">

      {/* Categories Bar */}
      <div className="categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`category-btn ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content */}
      <ShortsShelf />
      {loading ? (
        <div className="home-video-grid home-skeleton-grid" aria-label="Loading videos" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="home-video-skeleton" key={index}>
              <div className="home-skeleton-thumbnail" />
              <div className="home-skeleton-line home-skeleton-line--wide" />
              <div className="home-skeleton-line" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="home-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setRetryKey((key) => key + 1)}>
            <FaRedo aria-hidden="true" /> Retry
          </button>
        </div>
      ) : longVideos.length === 0 ? (
        <div className="home-empty">
          <h2>No videos found</h2>
          {search && <p>Search results for "{search}"</p>}
        </div>
      ) : (
        <section className="home-feed-section" aria-labelledby="recommended-title">
          <div className="home-section-heading">
            <h1 id="recommended-title">Recommended</h1>
          </div>
          <VideoGrid videos={longVideos} />
        </section>
      )}

    </div>
  );
}

export default Home;
