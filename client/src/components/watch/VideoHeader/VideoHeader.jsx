import ChannelInfo from "../ChannelInfo/ChannelInfo";
import ActionButtons from "../ActionButtons/ActionButtons";

import "./VideoHeader.css";

function VideoHeader({ video }) {
  if (!video) return null;

  return (
    <div className="video-header">

      <div className="header-left">
        <ChannelInfo channel={video.channel} />
      </div>

      <div className="header-right">
        <ActionButtons video={video} />
      </div>

    </div>
  );
}

export default VideoHeader;