import { useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";

import "./VideoCard.css";

import formatViews from "../../utils/formatViews";
import formatDuration from "../../utils/formatDuration";
import formatTimeAgo from "../../utils/formatTimeAgo";

const FALLBACK_CHANNEL_LOGO = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="24" fill="#2a2a2e"/><path d="M24 9a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 19c-8 0-14 4-14 9v2h28v-2c0-5-6-9-14-9Z" fill="#d6d6da"/></svg>'
)}`;

function VideoCard({ video, variant = "default", onClick }) {
  const navigate = useNavigate();

  const isShort = variant === "short";

  const handleVideoClick = () => {
    if (onClick) {
      onClick(video);
      return;
    }

    navigate(`/watch/${video._id}`);
  };

  const handleChannelClick = (event) => {
    event.stopPropagation();
    if (video.channel?.handle) navigate(`/channel/${video.channel.handle}`);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleVideoClick();
    }
  };

  return (
    <div
      className={`video-card ${isShort ? "video-card--short" : ""}`}
      onClick={handleVideoClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="video-thumbnail">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
        />

        <span className="video-duration">
          {formatDuration(video.duration)}
        </span>
      </div>

      <div className="video-details">
        <button
          type="button"
          className="channel-link channel-link--logo"
          onClick={handleChannelClick}
          disabled={!video.channel?.handle}
          aria-label={`Open ${video.channel?.channelName || "channel"}`}
        >
          <img
            className="channel-logo"
            src={video.channel?.logo || FALLBACK_CHANNEL_LOGO}
            alt={video.channel?.channelName || "Channel"}
          />
        </button>

        <div className="video-content">
          <h3 className="video-title">
            {video.title}
          </h3>

          <div className="channel-name">
            <button
              type="button"
              className="channel-link"
              onClick={handleChannelClick}
              disabled={!video.channel?.handle}
            >
              {video.channel?.channelName}
            </button>

            {video.channel?.verified && (
              <FaCheckCircle className="verified-icon" />
            )}
          </div>

          <div className="video-meta">
            <span>
              {formatViews(video.views)} views
            </span>

            <span>•</span>

            <span>
              {formatTimeAgo(video.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoCard;