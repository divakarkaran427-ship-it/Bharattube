import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import videoService from "../../services/video.service";
import watchHistoryService from "../../services/watchHistory.service";
import "./Watch.css";
import VideoPlayer from "../../components/watch/VideoPlayer/VideoPlayer";
import RelatedVideos from "../../components/watch/RelatedVideos/RelatedVideos";
import VideoHeader from "../../components/watch/VideoHeader/VideoHeader";
import Comments from "../../components/watch/Comments/Comments";
import Description from "../../components/watch/Description/Description";

const WATCH_HISTORY_SYNC_INTERVAL = 15_000;
const COMPLETION_THRESHOLD = 95;

function Watch() {
  const { id } = useParams();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const watchPageRef = useRef(null);
  const resumeTime = Math.max(0, Number(searchParams.get("resume")) || 0);

  useEffect(() => {
    let cancelled = false;

    const loadVideo = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await videoService.getVideoById(id);

        if (!cancelled) {
          setVideo(data);
        }
      } catch (requestError) {
        console.error(requestError);

        if (!cancelled) {
          setError(requestError.response?.data?.message || "Failed to load video");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadVideo();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const videoId = video?._id || id;

    if (!user || !videoId || !watchPageRef.current) {
      return undefined;
    }

    const player = watchPageRef.current.querySelector(".vp-video");

    if (!player) {
      return undefined;
    }

    const tracker = {
      hasStarted: false,
      isSeeking: false,
      lastObservedAt: 0,
      lastPosition: 0,
      lastSentAt: 0,
      lastSentPayload: "",
      watchTime: 0,
    };
    let requestInFlight = false;
    let isActive = true;
    let viewCountNeedsSync = false;
    let viewCountRefreshInFlight = false;

    const getDuration = () => {
      const playerDuration = Number(player.duration);
      const storedDuration = Number(video.duration);
      const duration = Number.isFinite(playerDuration) && playerDuration > 0
        ? playerDuration
        : storedDuration;

      return Number.isFinite(duration) && duration > 0 ? duration : 0;
    };

    const resetPlaybackCursor = () => {
      tracker.lastPosition = Math.max(0, Number(player.currentTime) || 0);
      tracker.lastObservedAt = performance.now();
    };

    const refreshVideoViews = async () => {
      if (!viewCountNeedsSync || viewCountRefreshInFlight) {
        return;
      }

      viewCountRefreshInFlight = true;

      try {
        const latestVideo = await videoService.getVideoById(videoId);

        if (isActive) {
          setVideo((currentVideo) => (
            String(currentVideo?._id) === String(videoId) ? latestVideo : currentVideo
          ));
          viewCountNeedsSync = false;
        }
      } catch {
        // Keep the current page usable; the next throttled progress sync can retry this refresh.
      } finally {
        viewCountRefreshInFlight = false;
      }
    };

    const syncProgress = (force = false) => {
      const duration = getDuration();

      if (!tracker.hasStarted || !duration || tracker.watchTime <= 0 || requestInFlight) {
        return;
      }

      const watchTime = Math.min(tracker.watchTime, duration);
      const lastPosition = Math.min(Math.max(0, Number(player.currentTime) || 0), duration);
      const completionPercentage = Math.min((watchTime / duration) * 100, 100);
      const payloadKey = `${Math.floor(watchTime)}:${Math.floor(lastPosition)}:${Math.floor(completionPercentage)}`;
      const now = Date.now();

      if (!force && now - tracker.lastSentAt < WATCH_HISTORY_SYNC_INTERVAL) {
        return;
      }

      if (payloadKey === tracker.lastSentPayload) {
        return;
      }

      requestInFlight = true;

      watchHistoryService.updateWatchProgress(videoId, {
        watchedDuration: watchTime,
        currentTime: lastPosition,
        duration,
        completed: completionPercentage >= COMPLETION_THRESHOLD,
      })
        .then((progressResult) => {
          tracker.lastSentAt = Date.now();
          tracker.lastSentPayload = payloadKey;

          // The backend is authoritative: only its genuine-view decision triggers a data refresh.
          if (progressResult?.viewCounted) {
            viewCountNeedsSync = true;
          }

          void refreshVideoViews();
        })
        .catch(() => {
          // The next meaningful playback event retries silently without interrupting video playback.
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

      if (!duration || document.visibilityState !== "visible" || player.paused || tracker.isSeeking) {
        resetPlaybackCursor();
        return;
      }

      const elapsedSeconds = Math.max(0, (now - tracker.lastObservedAt) / 1000);
      const playbackRate = Math.max(0.25, Number(player.playbackRate) || 1);
      const playbackDelta = currentPosition - tracker.lastPosition;
      const maximumGenuineDelta = (elapsedSeconds * playbackRate * 2.5) + 1;

      // Large jumps are seeks/skips, so they never increase genuine watch time.
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
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        syncProgress(true);
      }

      // Paused, backgrounded and minimized time is never counted as playback.
      resetPlaybackCursor();
    };

    player.addEventListener("play", handlePlay);
    player.addEventListener("timeupdate", handleTimeUpdate);
    player.addEventListener("pause", handlePause);
    player.addEventListener("seeking", handleSeeking);
    player.addEventListener("seeked", handleSeeked);
    player.addEventListener("ended", handleEnded);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isActive = false;
      syncProgress(true);
      player.removeEventListener("play", handlePlay);
      player.removeEventListener("timeupdate", handleTimeUpdate);
      player.removeEventListener("pause", handlePause);
      player.removeEventListener("seeking", handleSeeking);
      player.removeEventListener("seeked", handleSeeked);
      player.removeEventListener("ended", handleEnded);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [id, user, video]);

  if (loading) return <h2 style={{ padding: 20, color: "#fff" }}>Loading...</h2>;
  if (error) return <h2 style={{ padding: 20, color: "#ff4444" }}>{error}</h2>;
  if (!video) return <h2 style={{ padding: 20, color: "#fff" }}>Video not found.</h2>;

  return (
    <div ref={watchPageRef} className="watch-page">
      <div className="watch-container">
        <div className="watch-left">
          <VideoPlayer video={video} initialTime={resumeTime} />

          <div className="video-info">
            <h1 className="video-title">{video.title}</h1>
          </div>

          <VideoHeader video={video} />
          <Description video={video} />
          <Comments videoId={video._id} />
        </div>

        <div className="watch-right">
          <RelatedVideos currentVideoId={video._id} />
        </div>
      </div>
    </div>
  );
}

export default Watch;
