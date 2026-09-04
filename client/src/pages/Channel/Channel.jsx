import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  FaExclamationCircle,
  FaLayerGroup,
  FaPlayCircle,
} from "react-icons/fa";

import channelService from "../../services/channel.service";
import ChannelHeader from "../../components/Channel/ChannelHeader";
import ChannelTabs from "../../components/Channel/ChannelTabs";
import VideoCard from "../../components/VideoCard/VideoCard";
import FeaturedVideo from "../../components/Channel/FeaturedVideo";
import formatViews from "../../utils/formatViews";

import "./Channel.css";

const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "popular", label: "Popular" },
  { value: "oldest", label: "Oldest" },
];

const formatJoinDate = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(parsedDate);
};

const getVideoDate = (video) => {
  const date =
    video?.createdAt ||
    video?.publishedAt ||
    video?.uploadDate ||
    video?.uploadedAt;

  const timestamp = date ? new Date(date).getTime() : 0;

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getVideoViews = (video) => {
  const views =
    video?.views ??
    video?.viewCount ??
    video?.viewsCount ??
    0;

  const numericViews = Number(views);

  return Number.isFinite(numericViews) ? numericViews : 0;
};

const sortVideos = (collection, sortBy) => {
  const sorted = [...collection];

  if (sortBy === "popular") {
    return sorted.sort(
      (a, b) => getVideoViews(b) - getVideoViews(a)
    );
  }

  if (sortBy === "oldest") {
    return sorted.sort(
      (a, b) => getVideoDate(a) - getVideoDate(b)
    );
  }

  return sorted.sort(
    (a, b) => getVideoDate(b) - getVideoDate(a)
  );
};

function Channel() {
  const { handle } = useParams();

  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [activeTab, setActiveTab] = useState("home");
  const [sortBy, setSortBy] = useState("latest");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchChannel = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [channelRes, videosRes] = await Promise.all([
        channelService.getChannel(handle),
        channelService.getChannelVideos(handle),
      ]);

      const channelData =
        channelRes?.data?.data ||
        channelRes?.data ||
        null;

      const videosData = Array.isArray(videosRes?.data?.data)
        ? videosRes.data.data
        : Array.isArray(videosRes?.data)
          ? videosRes.data
          : [];

      setChannel(channelData);
      setVideos(videosData);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load this channel. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [handle]);

  useEffect(() => {
    fetchChannel();
  }, [fetchChannel]);

  const safeVideos = Array.isArray(videos) ? videos : [];

  const normalVideos = useMemo(
    () => safeVideos.filter((video) => !video.isShort),
    [safeVideos]
  );

  const shorts = useMemo(
    () => safeVideos.filter((video) => video.isShort === true),
    [safeVideos]
  );

  const sortedNormalVideos = useMemo(
    () => sortVideos(normalVideos, sortBy),
    [normalVideos, sortBy]
  );

  const sortedShorts = useMemo(
    () => sortVideos(shorts, sortBy),
    [shorts, sortBy]
  );

  const featuredVideo = sortedNormalVideos[0] || safeVideos[0] || null;

  const recentVideos = useMemo(() => {
    if (!featuredVideo) return [];

    return sortedNormalVideos.filter(
      (video) =>
        (video._id || video.id) !==
        (featuredVideo._id || featuredVideo.id)
    );
  }, [sortedNormalVideos, featuredVideo]);

  const renderSortControls = () => (
    <div
      className="channel-sort-controls"
      role="group"
      aria-label="Sort videos"
    >
      {SORT_OPTIONS.map((option) => {
        const active = sortBy === option.value;

        return (
          <button
            key={option.value}
            type="button"
            className={`channel-sort-button ${
              active ? "channel-sort-button--active" : ""
            }`}
            onClick={() => setSortBy(option.value)}
            aria-pressed={active}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );

  const renderVideoCollection = (
    collection,
    {
      title,
      eyebrow,
      emptyTitle,
      emptyMessage,
      showSort = true,
      gridClassName = "",
    }
  ) => (
    <section
      className="channel-videos"
      aria-labelledby="channel-videos-title"
    >
      <div className="channel-section-heading">
        <div>
          <p>{eyebrow}</p>
          <h2 id="channel-videos-title">{title}</h2>
        </div>

        {collection.length > 0 && (
          <span>
            {collection.length} video
            {collection.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {showSort && collection.length > 0 && renderSortControls()}

      {collection.length === 0 ? (
        <div className="empty-videos">
          <span aria-hidden="true">
            <FaPlayCircle />
          </span>

          <h3>{emptyTitle}</h3>

          <p>{emptyMessage}</p>
        </div>
      ) : (
       <div className={`channel-video-grid ${gridClassName}`}>
  {collection.map((video) => (
    <VideoCard
      key={video._id || video.id}
      video={video}
      variant={
        gridClassName === "channel-video-grid--shorts"
          ? "short"
          : "default"
      }
     />
    ))}
    </div>
      )}
    </section>
  );

  const renderTabPanel = () => {
    if (activeTab === "home") {
      return (
        <div
          id="channel-panel-home"
          role="tabpanel"
          aria-labelledby="channel-tab-home"
          tabIndex="0"
        >
          {featuredVideo ? (
            <section
              className="channel-featured"
              aria-labelledby="featured-video-title"
            >
              <div className="channel-section-heading">
                <div>
                  <p>LATEST UPLOAD</p>
                  <h2 id="featured-video-title">
                    Featured video
                  </h2>
                </div>
              </div>

              <FeaturedVideo video={featuredVideo} />
            </section>
          ) : null}

          {renderVideoCollection(recentVideos, {
            eyebrow: "RECENT UPLOADS",
            title: "Recent videos",
            emptyTitle: "No recent uploads",
            emptyMessage:
              "This creator has not published any public videos yet.",
            showSort: false,
          })}
        </div>
      );
    }

    if (activeTab === "videos") {
      return (
        <div
          id="channel-panel-videos"
          role="tabpanel"
          aria-labelledby="channel-tab-videos"
          tabIndex="0"
        >
          {renderVideoCollection(sortedNormalVideos, {
            eyebrow: "ALL VIDEOS",
            title: "Videos",
            emptyTitle: "No videos yet",
            emptyMessage:
              "This creator has not published any standard videos yet.",
          })}
        </div>
      );
    }

    if (activeTab === "shorts") {
      return (
        <div
          id="channel-panel-shorts"
          role="tabpanel"
          aria-labelledby="channel-tab-shorts"
          tabIndex="0"
        >
          {renderVideoCollection(sortedShorts, {
            eyebrow: "SHORT-FORM VIDEO",
            title: "Shorts",
            emptyTitle: "No Shorts yet",
            emptyMessage:
              "This creator has not published any Shorts yet.",
            gridClassName: "channel-video-grid--shorts",
          })}
        </div>
      );
    }

    if (activeTab === "playlists") {
      return (
        <section
          id="channel-panel-playlists"
          className="channel-tab-empty"
          role="tabpanel"
          aria-labelledby="channel-tab-playlists"
          tabIndex="0"
        >
          <span aria-hidden="true">
            <FaLayerGroup />
          </span>

          <p>PLAYLISTS</p>

          <h2>No public playlists available</h2>

          <p>
            The current channel API does not expose public
            playlist data for this channel yet.
          </p>
        </section>
      );
    }

    const subscribers =
      channel?.subscribersCount ??
      channel?.subscribers?.length ??
      0;

    return (
      <section
        id="channel-panel-about"
        className="channel-about"
        role="tabpanel"
        aria-labelledby="channel-tab-about"
        tabIndex="0"
      >
        <div className="channel-section-heading">
          <div>
            <p>ABOUT THIS CHANNEL</p>

            <h2>
              About {channel.channelName}
            </h2>
          </div>
        </div>

        <p className="channel-about-description">
          {channel?.description ||
            "This creator has not added a channel description yet."}
        </p>

        <dl className="channel-about-stats">
          <div>
            <dt>Handle</dt>
            <dd>
              @{channel?.handle || "unknown"}
            </dd>
          </div>

          <div>
            <dt>Joined</dt>
            <dd>
              {formatJoinDate(channel?.createdAt)}
            </dd>
          </div>

          <div>
            <dt>Total views</dt>
            <dd>
              {formatViews(channel?.totalViews ?? 0)}
            </dd>
          </div>

          <div>
            <dt>Subscribers</dt>
            <dd>
              {subscribers.toLocaleString()}
            </dd>
          </div>

          <div>
            <dt>Videos</dt>
            <dd>
              {channel?.totalVideos ??
                normalVideos.length}
            </dd>
          </div>
        </dl>
      </section>
    );
  };

  if (loading) {
    return (
      <main className="channel-page">
        <div
          className="channel-state"
          role="status"
          aria-live="polite"
        >
          <span
            className="channel-state-spinner"
            aria-hidden="true"
          />

          <p>Loading channel…</p>
        </div>
      </main>
    );
  }

  if (error || !channel) {
    return (
      <main className="channel-page">
        <section
          className="channel-state channel-state--error"
          role="alert"
        >
          <FaExclamationCircle aria-hidden="true" />

          <h1>Channel unavailable</h1>

          <p>
            {error ||
              "This channel could not be found."}
          </p>

          <button
            type="button"
            onClick={fetchChannel}
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="channel-page">
      <div className="channel-page-inner">
        <div
          className="channel-banner"
          aria-hidden={!channel?.banner}
        >
          {channel?.banner ? (
            <img
              src={channel.banner}
              alt=""
            />
          ) : (
            <div className="channel-banner-fallback" />
          )}
        </div>

        <ChannelHeader channel={channel} />

        <ChannelTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="channel-tab-content">
          {renderTabPanel()}
        </div>
      </div>
    </main>
  );
}

export default Channel;