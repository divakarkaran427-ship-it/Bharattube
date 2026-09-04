import { useNavigate } from "react-router-dom";
import formatViews from "../../../utils/formatViews";
import formatTimeAgo from "../../../utils/formatTimeAgo";

import "./RelatedVideoCard.css";

function RelatedVideoCard({ video }) {
  const navigate = useNavigate();

  return (
    <div
      className="related-video-card"
      onClick={() => navigate(`/watch/${video._id}`)}
    >
      <img
        src={video.thumbnail}
        alt={video.title}
        className="related-thumbnail"
      />

      <div className="related-info">

        <h4>{video.title}</h4>

        <p>{video.channel?.channelName}</p>

        <span>
          {formatViews(video.views)} views •{" "}
          {formatTimeAgo(video.createdAt)}
        </span>

      </div>
    </div>
  );
}

export default RelatedVideoCard;