import { FaClock, FaPlay, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import formatDuration from "../../utils/formatDuration";
import formatTimeAgo from "../../utils/formatTimeAgo";
import "./HistoryVideoCard.css";

const getProgress = (historyItem) => {
  const savedProgress = Number(historyItem.completionPercentage);

  if (Number.isFinite(savedProgress)) {
    return Math.min(Math.max(savedProgress, 0), 100);
  }

  const duration = Number(historyItem.duration || historyItem.video?.duration);
  const currentTime = Number(historyItem.currentTime || historyItem.watchedDuration);

  if (!duration || !currentTime) return 0;
  return Math.min((currentTime / duration) * 100, 100);
};

function HistoryVideoCard({ historyItem, onRemove, removing = false, variant = "default" }) {
  const navigate = useNavigate();
  const video = historyItem.video;

  if (!video) return null;

  const progress = getProgress(historyItem);
  const resumeTime = Math.max(0, Math.floor(Number(historyItem.currentTime || historyItem.watchedDuration) || 0));
  const watchedAt = historyItem.lastWatchedAt || historyItem.watchedAt || historyItem.updatedAt;

  const resumeVideo = () => {
    navigate(`/watch/${video._id}?resume=${resumeTime}`);
  };

  return (
    <article className={`history-video-card history-video-card--${variant}`}>
      <button type="button" className="history-video-thumbnail" onClick={resumeVideo} aria-label={`Resume ${video.title}`}>
        <img src={video.thumbnail} alt="" loading="lazy" />
        <span className="history-video-duration">{formatDuration(video.duration)}</span>
        <span className="history-video-play" aria-hidden="true"><FaPlay /></span>
      </button>

      <div className="history-video-details">
        <div className="history-video-copy">
          <h3>{video.title}</h3>
          <p>{video.channel?.channelName || "BharatTube Creator"}</p>
          <p className="history-video-meta">
            <FaClock aria-hidden="true" /> Watched {formatTimeAgo(watchedAt)}
          </p>
        </div>

        <div className="history-video-actions">
          <button type="button" className="history-resume-button" onClick={resumeVideo}>
            <FaPlay aria-hidden="true" /> Continue
          </button>
          <button
            type="button"
            className="history-remove-button"
            onClick={() => onRemove?.(video._id)}
            disabled={removing}
            aria-label={`Remove ${video.title} from watch history`}
          >
            <FaTrash aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="history-video-progress" aria-label={`${Math.round(progress)} percent watched`}>
        <span style={{ width: `${progress}%` }} />
      </div>
    </article>
  );
}

export default HistoryVideoCard;
