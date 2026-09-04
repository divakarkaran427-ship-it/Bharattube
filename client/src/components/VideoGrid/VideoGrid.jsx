import VideoCard from "../VideoCard/VideoCard";

function VideoGrid({ videos = [] }) {
  if (!videos.length) {
    return (
      <div style={{ color: "#aaa", textAlign: "center", padding: "60px 20px", fontSize: "18px" }}>
        No videos found.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: "16px",
      }}
    >
      {videos.map((video) => (
        <VideoCard key={video._id} video={video} />
      ))}
    </div>
  );
}

export default VideoGrid;
