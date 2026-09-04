import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowDown,
  FaArrowUp,
  FaCheckCircle,
  FaCopy,
  FaEllipsisV,
  FaExternalLinkAlt,
  FaLink,
  FaPlay,
  FaRegCommentDots,
  FaShare,
  FaThumbsDown,
  FaThumbsUp,
  FaTimes,
  FaUserCircle,
  FaVolumeMute,
  FaVolumeUp,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import Comments from "../../components/watch/Comments/Comments";
import reactionService from "../../services/reaction.service";
import shortsService from "../../services/shorts.service";
import subscriptionService from "../../services/subscription.service";
import videoService from "../../services/video.service";
import watchHistoryService from "../../services/watchHistory.service";
import formatViews from "../../utils/formatViews";
import "./Shorts.css";

const WATCH_HISTORY_SYNC_INTERVAL = 15_000;
const COMPLETION_THRESHOLD = 95;
const SWIPE_PRELOAD_DISTANCE = 1;

const getId = (value) => String(value?._id || value || "");

const getReaction = (short, userId) => {
  if (!userId) return null;

  if (Array.isArray(short.likes) && short.likes.some((id) => getId(id) === String(userId))) {
    return "like";
  }

  if (Array.isArray(short.dislikes) && short.dislikes.some((id) => getId(id) === String(userId))) {
    return "dislike";
  }

  return null;
};

const copyText = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
};

function ShortPlayer({
  short,
  index,
  total,
  isActive,
  isPrepared,
  pageVisible,
  onNext,
  onPrevious,
  onViewCounted,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const menuRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [reaction, setReaction] = useState(() => getReaction(short, user?._id));
  const [likes, setLikes] = useState(Number(short.likesCount || short.likes?.length || 0));
  const [dislikes, setDislikes] = useState(Number(short.dislikesCount || short.dislikes?.length || 0));
  const [reactionPending, setReactionPending] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(() => (
    Array.isArray(short.channel?.subscribers)
    && short.channel.subscribers.some((id) => getId(id) === String(user?._id))
  ));
  const [subscriberCount, setSubscriberCount] = useState(() => (
    Array.isArray(short.channel?.subscribers) ? short.channel.subscribers.length : 0
  ));
  const [subscriptionPending, setSubscriptionPending] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [feedback, setFeedback] = useState("");

  const channel = short.channel || {};
  const channelHandle = channel.handle ? "@" + channel.handle : "";
  const shortUrl = window.location.origin + "/watch/" + short._id;
  const hasLongCaption = (short.title || "").length > 92 || Boolean(short.description);

  const showFeedback = useCallback((message) => {
    window.clearTimeout(feedbackTimeoutRef.current);
    setFeedback(message);
    feedbackTimeoutRef.current = window.setTimeout(() => setFeedback(""), 2_400);
  }, []);

  useEffect(() => () => window.clearTimeout(feedbackTimeoutRef.current), []);

  useEffect(() => {
    setReaction(getReaction(short, user?._id));
    setLikes(Number(short.likesCount || short.likes?.length || 0));
    setDislikes(Number(short.dislikesCount || short.dislikes?.length || 0));
    setIsSubscribed(
      Array.isArray(short.channel?.subscribers)
      && short.channel.subscribers.some((id) => getId(id) === String(user?._id))
    );
    setSubscriberCount(Array.isArray(short.channel?.subscribers) ? short.channel.subscribers.length : 0);
  }, [short, user?._id]);

  useEffect(() => {
    if (!isActive) {
      setCommentsOpen(false);
      setMenuOpen(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeMenu = (event) => {
      if (event.type === "keydown") {
        if (event.key === "Escape") setMenuOpen(false);
        return;
      }

      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeMenu);

    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeMenu);
    };
  }, [menuOpen]);

  useEffect(() => {
    const player = videoRef.current;
    if (!player) return;

    if (!isActive || !isPrepared || !pageVisible || commentsOpen) {
      player.pause();
      setIsPlaying(false);
      return;
    }

    player.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [commentsOpen, isActive, isPrepared, pageVisible, short._id]);

  useEffect(() => {
    const player = videoRef.current;
    const videoId = short._id;

    if (!player || !user?._id || !isActive || !isPrepared || !pageVisible || commentsOpen) {
      return undefined;
    }

    const tracker = {
      hasStarted: !player.paused,
      isSeeking: false,
      lastObservedAt: performance.now(),
      lastPosition: Math.max(0, Number(player.currentTime) || 0),
      lastSentAt: 0,
      lastSentPayload: "",
      watchTime: 0,
    };
    let requestInFlight = false;

    const getDuration = () => {
      const duration = Number(player.duration || short.duration);
      return Number.isFinite(duration) && duration > 0 ? duration : 0;
    };

    const resetPlaybackCursor = () => {
      tracker.lastPosition = Math.max(0, Number(player.currentTime) || 0);
      tracker.lastObservedAt = performance.now();
    };

    const syncProgress = (force = false) => {
      const duration = getDuration();

      if (!tracker.hasStarted || !duration || tracker.watchTime <= 0 || requestInFlight) {
        return;
      }

      const watchTime = Math.min(tracker.watchTime, duration);
      const lastPosition = Math.min(Math.max(0, Number(player.currentTime) || 0), duration);
      const completionPercentage = Math.min((watchTime / duration) * 100, 100);
      const payloadKey = [
        Math.floor(watchTime),
        Math.floor(lastPosition),
        Math.floor(completionPercentage),
      ].join(":");
      const now = Date.now();

      if (!force && now - tracker.lastSentAt < WATCH_HISTORY_SYNC_INTERVAL) return;
      if (payloadKey === tracker.lastSentPayload) return;

      requestInFlight = true;

      watchHistoryService.updateWatchProgress(videoId, {
        watchedDuration: watchTime,
        currentTime: lastPosition,
        duration,
        completed: completionPercentage >= COMPLETION_THRESHOLD,
      })
        .then((result) => {
          tracker.lastSentAt = Date.now();
          tracker.lastSentPayload = payloadKey;

          if (result?.viewCounted) {
            onViewCounted(videoId);
          }
        })
        .catch(() => {
          // Playback stays uninterrupted; a later meaningful event retries the sync.
        })
        .finally(() => {
          requestInFlight = false;
        });
    };

    const handlePlay = () => {
      tracker.hasStarted = true;
      resetPlaybackCursor();
    };

    const handleTimeUpdate = () => {
      const duration = getDuration();
      const currentPosition = Math.max(0, Number(player.currentTime) || 0);
      const now = performance.now();

      if (!duration || player.paused || tracker.isSeeking || document.visibilityState !== "visible") {
        resetPlaybackCursor();
        return;
      }

      const elapsedSeconds = Math.max(0, (now - tracker.lastObservedAt) / 1000);
      const playbackRate = Math.max(0.25, Number(player.playbackRate) || 1);
      const playbackDelta = currentPosition - tracker.lastPosition;
      const maximumGenuineDelta = (elapsedSeconds * playbackRate * 2.5) + 1;

      if (playbackDelta > 0 && playbackDelta <= maximumGenuineDelta) {
        tracker.watchTime = Math.min(tracker.watchTime + playbackDelta, duration);
      }

      tracker.lastPosition = currentPosition;
      tracker.lastObservedAt = now;
      syncProgress();
    };

    const handleSeeking = () => {
      tracker.isSeeking = true;
      syncProgress(true);
    };

    const handleSeeked = () => {
      tracker.isSeeking = false;
      resetPlaybackCursor();
    };

    const handlePause = () => {
      syncProgress(true);
      resetPlaybackCursor();
    };

    const handleEnded = () => {
      handleTimeUpdate();
      syncProgress(true);
      onNext();
    };

    player.addEventListener("play", handlePlay);
    player.addEventListener("timeupdate", handleTimeUpdate);
    player.addEventListener("pause", handlePause);
    player.addEventListener("seeking", handleSeeking);
    player.addEventListener("seeked", handleSeeked);
    player.addEventListener("ended", handleEnded);

    return () => {
      syncProgress(true);
      player.removeEventListener("play", handlePlay);
      player.removeEventListener("timeupdate", handleTimeUpdate);
      player.removeEventListener("pause", handlePause);
      player.removeEventListener("seeking", handleSeeking);
      player.removeEventListener("seeked", handleSeeked);
      player.removeEventListener("ended", handleEnded);
    };
  }, [commentsOpen, isActive, isPrepared, onNext, onViewCounted, pageVisible, short._id, short.duration, user?._id]);

  const togglePlayback = () => {
    const player = videoRef.current;
    if (!player) return;

    if (player.paused) {
      player.play().catch(() => showFeedback("Tap again to play this Short."));
    } else {
      player.pause();
    }
  };

  const handleStageKeyDown = (event) => {
    if (event.target !== event.currentTarget) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePlayback();
    }
  };

  const toggleMute = (event) => {
    event.stopPropagation();
    const player = videoRef.current;
    if (!player) return;

    player.muted = !player.muted;
    setIsMuted(player.muted);
  };

  const handleReaction = async (nextReaction, event) => {
    event.stopPropagation();
    if (reactionPending) return;

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setReactionPending(true);
      const result = reaction === nextReaction
        ? await reactionService.removeReaction(short._id)
        : nextReaction === "like"
          ? await reactionService.likeVideo(short._id)
          : await reactionService.dislikeVideo(short._id);

      setLikes(Number(result.likes ?? likes));
      setDislikes(Number(result.dislikes ?? dislikes));
      setReaction(reaction === nextReaction ? null : nextReaction);
    } catch (error) {
      showFeedback(error.response?.data?.message || "Unable to update reaction.");
    } finally {
      setReactionPending(false);
    }
  };

  const handleCopyLink = async (event) => {
    event?.stopPropagation();

    try {
      await copyText(shortUrl);
      showFeedback("Link copied.");
      setMenuOpen(false);
    } catch {
      showFeedback("Unable to copy link.");
    }
  };

  const handleShare = async (event) => {
    event.stopPropagation();

    try {
      if (navigator.share) {
        await navigator.share({
          title: short.title,
          text: short.description || short.title,
          url: shortUrl,
        });
        showFeedback("Short shared.");
      } else {
        await handleCopyLink();
      }
    } catch (error) {
      if (error?.name !== "AbortError") showFeedback("Unable to share this Short.");
    }
  };

  const openComments = (event) => {
    event.stopPropagation();
    videoRef.current?.pause();
    setCommentsOpen(true);
  };

  const handleSubscribe = async (event) => {
    event.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    if (!channel._id || subscriptionPending) return;

    try {
      setSubscriptionPending(true);
      const result = await subscriptionService.toggleSubscription(channel._id);

      setIsSubscribed(Boolean(result.isSubscribed));
      setSubscriberCount(Number(result.subscribers || 0));
      showFeedback(result.message || "Subscription updated.");
    } catch (error) {
      showFeedback(error.response?.data?.message || "Unable to update subscription.");
    } finally {
      setSubscriptionPending(false);
    }
  };

  const openChannel = (event) => {
    event.stopPropagation();
    if (channel.handle) navigate("/channel/" + channel.handle);
  };

  return (
    <article
      className={"short-player " + (isActive ? "is-active" : "")}
      data-short-index={index}
      tabIndex={isActive ? 0 : -1}
      role="button"
      aria-label={(isPlaying ? "Pause " : "Play ") + (short.title || "Short")}
      onClick={togglePlayback}
      onKeyDown={handleStageKeyDown}
    >
      <video
        ref={videoRef}
        className="short-video"
        src={isPrepared ? short.videoUrl : undefined}
        poster={short.thumbnail || undefined}
        muted={isMuted}
        playsInline
        preload={isActive ? "auto" : isPrepared ? "metadata" : "none"}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          const player = videoRef.current;
          if (player?.duration) setProgress((player.currentTime / player.duration) * 100);
        }}
      />

      <div className="shorts-video-scrim" aria-hidden="true" />

      <div className="short-progress" aria-hidden="true">
        <div className="short-progress-fill" style={{ width: progress + "%" }} />
      </div>

      {!isPlaying && isActive && (
        <div className="short-play-overlay" aria-hidden="true">
          <FaPlay />
        </div>
      )}

      <div className="short-top-controls" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="short-mute-btn"
          aria-label={isMuted ? "Unmute Short" : "Mute Short"}
          onClick={toggleMute}
        >
          {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
      </div>

      <div className="short-bottom" onClick={(event) => event.stopPropagation()}>
        <div className="short-creator-row">
          <button type="button" className="short-channel" onClick={openChannel} disabled={!channel.handle}>
            {channel.logo ? (
              <img src={channel.logo} alt="" className="short-avatar" />
            ) : (
              <FaUserCircle className="short-avatar short-avatar-fallback" aria-hidden="true" />
            )}
            <span className="short-channel-copy">
              <span className="short-channel-name">
                {channel.channelName || "Channel"}
                {channel.verified && <FaCheckCircle className="short-verified" aria-label="Verified creator" />}
              </span>
              {channelHandle && <span className="short-channel-handle">{channelHandle}</span>}
            </span>
          </button>

          <div className="short-subscribe">
            <button
              type="button"
              className={"short-subscribe-btn " + (isSubscribed ? "is-subscribed" : "")}
              onClick={handleSubscribe}
              disabled={subscriptionPending || !channel._id}
            >
              {subscriptionPending ? "Saving..." : isSubscribed ? "Subscribed" : "Subscribe"}
            </button>
            <span className="short-subscriber-count">{formatViews(subscriberCount)} subscribers</span>
          </div>
        </div>

        <div className="short-title-wrap">
          <p className="short-title">{short.title}</p>
          {descriptionExpanded && short.description && <p className="short-desc">{short.description}</p>}
          {hasLongCaption && (
            <button
              type="button"
              className="short-more-btn"
              aria-expanded={descriptionExpanded}
              onClick={() => setDescriptionExpanded((current) => !current)}
            >
              {descriptionExpanded ? "Show less" : "...more"}
            </button>
          )}
        </div>

        {short.tags?.length > 0 && (
          <div className="short-tags" aria-label="Hashtags">
            {short.tags.slice(0, 5).map((tag) => <span key={tag} className="short-tag">#{tag}</span>)}
          </div>
        )}

        <p className="short-views">{formatViews(short.views)} views</p>
      </div>

      <div className="short-actions" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className={"short-action-btn " + (reaction === "like" ? "active" : "")}
          aria-label="Like this Short"
          aria-pressed={reaction === "like"}
          disabled={reactionPending}
          onClick={(event) => handleReaction("like", event)}
        >
          <FaThumbsUp />
          <span>{formatViews(likes)}</span>
        </button>

        <button
          type="button"
          className={"short-action-btn " + (reaction === "dislike" ? "active" : "")}
          aria-label="Dislike this Short"
          aria-pressed={reaction === "dislike"}
          disabled={reactionPending}
          onClick={(event) => handleReaction("dislike", event)}
        >
          <FaThumbsDown />
          <span>{formatViews(dislikes)}</span>
        </button>

        <button type="button" className="short-action-btn" aria-label="Open comments" onClick={openComments}>
          <FaRegCommentDots />
          <span>{formatViews(short.commentsCount || 0)}</span>
        </button>

        <button type="button" className="short-action-btn" aria-label="Share this Short" onClick={handleShare}>
          <FaShare />
          <span>Share</span>
        </button>

        <div className="short-more-menu" ref={menuRef}>
          <button
            type="button"
            className="short-action-btn"
            aria-label="More Short options"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <FaEllipsisV />
            <span>More</span>
          </button>

          {menuOpen && (
            <div className="short-menu-popover" role="menu" aria-label="Short options">
              <button type="button" role="menuitem" onClick={handleCopyLink}>
                <FaCopy />
                Copy link
              </button>
              <button type="button" role="menuitem" onClick={() => navigate("/watch/" + short._id)}>
                <FaExternalLinkAlt />
                Open watch page
              </button>
            </div>
          )}
        </div>

        <button type="button" className="short-thumb-circle" aria-label="Copy Short link" onClick={handleCopyLink}>
          {short.thumbnail ? <img src={short.thumbnail} alt="" /> : <FaLink aria-hidden="true" />}
        </button>
      </div>

      <div className="short-nav-arrows" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="short-nav-btn" aria-label="Previous Short" onClick={onPrevious} disabled={index === 0}>
          <FaArrowUp />
        </button>
        <button type="button" className="short-nav-btn" aria-label="Next Short" onClick={onNext} disabled={index === total - 1}>
          <FaArrowDown />
        </button>
      </div>

      {feedback && <p className="short-feedback" role="status">{feedback}</p>}

      {commentsOpen && (
        <div
          className="short-comments-layer"
          role="presentation"
          onClick={(event) => {
            event.stopPropagation();
            setCommentsOpen(false);
          }}
        >
          <section
            className="short-comments-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={"Comments for " + short.title}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="short-comments-header">
              <h2>Comments</h2>
              <button type="button" aria-label="Close comments" onClick={() => setCommentsOpen(false)}>
                <FaTimes />
              </button>
            </header>
            <Comments videoId={short._id} />
          </section>
        </div>
      )}
    </article>
  );
}

function Shorts() {
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState === "visible");
  const containerRef = useRef(null);
  const shortRefs = useRef([]);
  const loadingPagesRef = useRef(new Set());
  const refreshedShortIdsRef = useRef(new Set());

  const loadShorts = useCallback(async ({ nextPage = 1, append = false } = {}) => {
    if (loadingPagesRef.current.has(nextPage)) return;

    loadingPagesRef.current.add(nextPage);

    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      setError("");
      const data = await shortsService.getFeed({ page: nextPage, limit: 10 });
      const nextShorts = Array.isArray(data.shorts) ? data.shorts : [];

      setShorts((currentShorts) => {
        if (!append) return nextShorts;

        const existingIds = new Set(currentShorts.map((item) => item._id));
        return [...currentShorts, ...nextShorts.filter((item) => !existingIds.has(item._id))];
      });
      setPage(nextPage);
      setHasMore(Boolean(data.pagination?.hasNextPage));

      if (!append) setActiveIndex(0);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load Shorts.");
    } finally {
      loadingPagesRef.current.delete(nextPage);
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShorts();
  }, [loadShorts]);

  useEffect(() => {
    const handleVisibilityChange = () => setPageVisible(document.visibilityState === "visible");

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !shorts.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

        if (mostVisibleEntry) {
          setActiveIndex(Number(mostVisibleEntry.target.dataset.shortIndex));
        }
      },
      { root: container, threshold: [0.55, 0.75] }
    );

    shortRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [shorts]);

  useEffect(() => {
    if (activeIndex >= shorts.length - 2 && hasMore && !loadingMore) {
      loadShorts({ nextPage: page + 1, append: true });
    }
  }, [activeIndex, hasMore, loadShorts, loadingMore, page, shorts.length]);

  const goToShort = useCallback((targetIndex) => {
    const nextIndex = Math.max(0, Math.min(targetIndex, shorts.length - 1));
    const target = shortRefs.current[nextIndex];

    setActiveIndex(nextIndex);

    if (target) {
      const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    }
  }, [shorts.length]);

  const goNext = useCallback(() => goToShort(activeIndex + 1), [activeIndex, goToShort]);
  const goPrevious = useCallback(() => goToShort(activeIndex - 1), [activeIndex, goToShort]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tagName = event.target?.tagName;
      if (["INPUT", "TEXTAREA", "BUTTON"].includes(tagName)) return;

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }

      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrevious]);

  const refreshShortFromServer = useCallback(async (shortId) => {
    if (refreshedShortIdsRef.current.has(shortId)) return;

    refreshedShortIdsRef.current.add(shortId);

    try {
      const updatedShort = await videoService.getVideoById(shortId);
      setShorts((currentShorts) => currentShorts.map((item) => (
        item._id === shortId ? { ...item, ...updatedShort } : item
      )));
    } catch {
      refreshedShortIdsRef.current.delete(shortId);
    }
  }, []);

  if (loading) {
    return (
      <main className="shorts-loading" aria-live="polite">
        <div className="shorts-spinner" />
        <p>Loading Shorts…</p>
      </main>
    );
  }

  if (error && !shorts.length) {
    return (
      <main className="shorts-error" role="alert">
        <p>{error}</p>
        <button type="button" onClick={() => loadShorts()}>Try Again</button>
      </main>
    );
  }

  if (!shorts.length) {
    return (
      <main className="shorts-empty">
        <h1>No Shorts yet</h1>
        <p>New creator Shorts will appear here.</p>
      </main>
    );
  }

  return (
    <main className="shorts-page" ref={containerRef} aria-label="BharatTube Shorts feed">
      {shorts.map((short, index) => (
        <div
          key={short._id}
          ref={(node) => { shortRefs.current[index] = node; }}
          data-short-index={index}
          className="short-feed-item"
        >
          <ShortPlayer
            short={short}
            index={index}
            total={shorts.length}
            isActive={index === activeIndex}
            isPrepared={Math.abs(index - activeIndex) <= SWIPE_PRELOAD_DISTANCE}
            pageVisible={pageVisible}
            onNext={goNext}
            onPrevious={goPrevious}
            onViewCounted={refreshShortFromServer}
          />
        </div>
      ))}

      {loadingMore && (
        <div className="shorts-load-more-indicator" aria-live="polite">
          <div className="shorts-spinner" />
        </div>
      )}

      {error && <p className="shorts-inline-error" role="status">{error}</p>}
    </main>
  );
}

export default Shorts;
