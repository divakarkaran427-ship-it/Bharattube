import { useEffect, useState } from "react";
import videoService from "../../../services/video.service";
import RelatedVideoCard from "./RelatedVideoCard";
import "./RelatedVideos.css";

function RelatedVideos({ currentVideoId }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true);
        const res = await videoService.getRelatedVideos(currentVideoId);

        // ⭐ res = response.data.data = { videos: [...], pagination: {...} }
        setVideos(res?.videos || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (currentVideoId) loadVideos();
  }, [currentVideoId]);

  if (loading) {
    return (
      <div className="related-videos">
        <h3>Related Videos</h3>
        <p style={{ color: "#888" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="related-videos">
      <h3>Related Videos</h3>
      {videos.length > 0 ? (
        videos.map((video) => (
          <RelatedVideoCard key={video._id} video={video} />
        ))
      ) : (
        <p style={{ color: "#888" }}>Koi related video nahi mila</p>
      )}
    </div>
  );
}

export default RelatedVideos;
