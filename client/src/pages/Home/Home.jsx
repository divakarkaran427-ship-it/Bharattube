import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import VideoGrid from "../../components/VideoGrid/VideoGrid";
import { useAuth } from "../../context/AuthContext";
import recommendationService from "../../services/recommendation.service";
import videoService from "../../services/video.service";
import "./Home.css";

const CATEGORIES = [
  "All", "Music", "Gaming", "News", "Sports",
  "Education", "Comedy", "Technology", "Food",
  "Travel", "Fitness", "Fashion", "Movies", "Live",
];

function Home() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

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
  }, [search, activeCategory, shouldUsePersonalizedFeed]);

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
      {loading ? (
        <div className="home-loading">Loading videos...</div>
      ) : error ? (
        <div className="home-error">{error}</div>
      ) : videos.length === 0 ? (
        <div className="home-empty">
          <h2>No videos found</h2>
          {search && <p>Search results for "{search}"</p>}
        </div>
      ) : (
        <VideoGrid videos={videos} />
      )}

    </div>
  );
}

export default Home;
