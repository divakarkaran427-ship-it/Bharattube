import { FaCheckCircle } from "react-icons/fa";

import "./ChannelCard.css";

function ChannelCard({ channel }) {
  if (!channel) return null;

  return (
    <div className="channel-card">

      <div className="channel-left">

        <img
          src={
            channel.logo ||
            "https://via.placeholder.com/60"
          }
          alt={channel.channelName}
        />

        <div className="channel-details">

          <div className="channel-title">

            <h3>{channel.channelName}</h3>

            {channel.verified && (
              <FaCheckCircle className="verified-icon" />
            )}

          </div>

          <p className="channel-handle">
            @{channel.handle}
          </p>

          <p className="subscriber-count">
            {channel.subscribers?.length || 0} Subscribers
          </p>

        </div>

      </div>

      <button className="subscribe-btn">
        Subscribe
      </button>

    </div>
  );
}

export default ChannelCard;