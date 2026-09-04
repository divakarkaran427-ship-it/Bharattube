import { useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";

import formatViews from "../../utils/formatViews";
import formatTimeAgo from "../../utils/formatTimeAgo";

import "./ChannelVideoCard.css";

const FALLBACK_LOGO =
  "https://placehold.co/80x80/222/ffffff?text=B";

function ChannelVideoCard({ video }) {

  const navigate = useNavigate();

  return (

    <div
      className="channel-video-card"
      onClick={() => navigate(`/watch/${video._id}`)}
    >

      <div className="channel-video-thumb">

        <img
          src={video.thumbnail}
          alt={video.title}
        />

        <span className="channel-video-duration">

          {Math.floor(video.duration / 60)}:
          {String(Math.floor(video.duration % 60)).padStart(2,"0")}

        </span>

      </div>

      <div className="channel-video-info">

        <img
          src={video.channel.logo || FALLBACK_LOGO}
          className="channel-video-logo"
          alt=""
        />

        <div className="channel-video-meta">

          <h3>

            {video.title}

          </h3>

          <div className="channel-video-channel">

            <span>

              {video.channel.channelName}

            </span>

            {video.channel.verified && (

              <FaCheckCircle className="verified-icon"/>

            )}

          </div>

          <div className="channel-video-stats">

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

export default ChannelVideoCard;