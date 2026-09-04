import { useState } from "react";
import "./Description.css";
import formatTimeAgo from "../../../utils/formatTimeAgo";
import formatViews from "../../../utils/formatViews";

function Description({ video }) {
  const [expanded, setExpanded] = useState(false);

  if (!video) return null;

  const text = video.description || "";
  const isLong = text.length > 200;
  const displayText = expanded || !isLong ? text : text.slice(0, 200) + "...";

  // Convert timestamps like 0:00, 1:23 to clickable (basic)
  const renderText = (str) => {
    return str.split("\n").map((line, i) => (
      <span key={i}>
        {line}
        <br />
      </span>
    ));
  };

  return (
    <div className={`desc-box ${expanded ? "expanded" : ""}`}>

      {/* Stats Row */}
      <div className="desc-stats">
        <span>{formatViews(video.views)} views</span>
        <span>•</span>
        <span>{formatTimeAgo(video.createdAt)}</span>
        {video.category && (
          <>
            <span>•</span>
            <span className="desc-category">#{video.category}</span>
          </>
        )}
        {video.language && (
          <span className="desc-category">#{video.language}</span>
        )}
      </div>

      {/* Tags */}
      {video.tags?.length > 0 && (
        <div className="desc-tags">
          {video.tags.map((tag, i) => (
            <span key={i} className="desc-tag">#{tag}</span>
          ))}
        </div>
      )}

      {/* Description Text */}
      {text && (
        <div className="desc-text">
          {renderText(displayText)}
        </div>
      )}

      {/* Show More / Less */}
      {isLong && (
        <button
          className="desc-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : "...more"}
        </button>
      )}

    </div>
  );
}

export default Description;