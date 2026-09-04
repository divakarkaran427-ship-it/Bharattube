import { useEffect, useState } from "react";
import { FaCheckCircle, FaShare } from "react-icons/fa";
import ChannelInfo from "../watch/ChannelInfo/ChannelInfo";
import formatViews from "../../utils/formatViews";
import "./ChannelHeader.css";

const formatJoinDate = (date) => {
  if (!date) return null;

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(parsed);
};

function ChannelHeader({ channel }) {
  const [shareMessage, setShareMessage] = useState("");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    if (!isDescriptionExpanded) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsDescriptionExpanded(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isDescriptionExpanded]);

  if (!channel) return null;

  const subscribers =
    channel.subscribersCount ??
    channel.subscribers?.length ??
    0;

  const joinedDate = formatJoinDate(channel.createdAt);
  const description = channel.description?.trim();
  const isLongDescription = description && description.length > 140;

  const avatar =
    channel.logo ||
    channel.owner?.profilePhoto ||
    "https://placehold.co/180x180/222/ffffff?text=B";

  const channelUrl =
    `${window.location.origin}/channel/${channel.handle}`;

  const handleShare = async () => {
    try {

      if (navigator.share) {

        await navigator.share({
          title: channel.channelName,
          text: `Watch videos from ${channel.channelName}`,
          url: channelUrl,
        });

        setShareMessage("Channel shared successfully.");

      } else {

        await navigator.clipboard.writeText(channelUrl);

        setShareMessage("Channel link copied.");

      }

    } catch (err) {

      if (err.name !== "AbortError") {

        setShareMessage("Unable to share.");

      }

    }
  };

  return (
    <header className="channel-header">

      <div className="channel-header-left">

        <div className="channel-avatar-wrapper">

          <img
            src={avatar}
            alt={channel.channelName}
            className="channel-avatar"
          />

        </div>

        <div className="channel-meta">

          <div className="channel-title-row">

            <div className="channel-info-block">

              <div className="channel-title">

                <h1>{channel.channelName}</h1>

                {channel.verified && (
                  <FaCheckCircle className="verified-icon" />
                )}

              </div>

              <p className="channel-handle">

                @{channel.handle}

              </p>

              <p className="channel-stats">

                <span>
                  {subscribers.toLocaleString()} subscribers
                </span>

                <span>•</span>

                <span>
                  {channel.totalVideos ?? 0} videos
                </span>

                <span>•</span>

                <span>
                  {formatViews(channel.totalViews ?? 0)} views
                </span>

              </p>

              {description && (

                <div className="channel-description-wrapper">

                  <p className={`channel-description ${isDescriptionExpanded ? "channel-description--expanded" : ""}`}>

                    {description}

                  </p>

                  {isLongDescription && (
                    <button
                      type="button"
                      className="channel-description-toggle"
                      aria-expanded={isDescriptionExpanded}
                      onClick={() => setIsDescriptionExpanded((expanded) => !expanded)}
                    >
                      …more
                    </button>
                  )}

                </div>

              )}

              {joinedDate && (

                <p className="channel-join-date">

                  Joined {joinedDate}

                </p>

              )}

            </div>

            <div className="channel-actions">

              <ChannelInfo channel={channel} />

              <button
                type="button"
                className="share-btn"
                onClick={handleShare}
              >

                <FaShare />

                <span>Share</span>

              </button>

            </div>

          </div>

          {shareMessage && (

            <span
              className="channel-share-message"
              role="status"
              aria-live="polite"
            >

              {shareMessage}

            </span>

          )}

        </div>

      </div>

      {isDescriptionExpanded && (
        <div
          className="channel-info-dialog-backdrop"
          role="presentation"
          onMouseDown={() => setIsDescriptionExpanded(false)}
        >
          <section
            className="channel-info-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="channel-info-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="channel-info-dialog-header">
              <h2 id="channel-info-dialog-title">{channel.channelName}</h2>
              <button
                type="button"
                className="channel-info-dialog-close"
                aria-label="Close channel information"
                onClick={() => setIsDescriptionExpanded(false)}
              >
                ×
              </button>
            </header>

            <div className="channel-info-dialog-content">
              <section aria-labelledby="channel-description-title">
                <h3 id="channel-description-title">Description</h3>
                <p>{description}</p>
              </section>

              <section aria-labelledby="channel-more-info-title">
                <h3 id="channel-more-info-title">More info</h3>
                <dl className="channel-info-dialog-list">
                  <div><dt>Handle</dt><dd>@{channel.handle}</dd></div>
                  {joinedDate && <div><dt>Joined</dt><dd>{joinedDate}</dd></div>}
                  <div><dt>Subscribers</dt><dd>{subscribers.toLocaleString()}</dd></div>
                  <div><dt>Videos</dt><dd>{channel.totalVideos ?? 0}</dd></div>
                </dl>
              </section>
            </div>
          </section>
        </div>
      )}

    </header>
  );
}

export default ChannelHeader;
