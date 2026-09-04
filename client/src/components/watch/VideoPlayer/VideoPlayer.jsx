import { useRef, useState, useEffect, useCallback } from "react";
import {
  FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaVolumeDown,
  FaExpand, FaCompress, FaStepBackward, FaStepForward,
  FaClosedCaptioning, FaCog, FaThLarge, FaMoon,
} from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext";
import watchHistoryService from "../../../services/watchHistory.service";
import "./VideoPlayer.css";

function formatTime(sec) {
  if (isNaN(sec) || sec < 0) return "0:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
  return `${m}:${s.toString().padStart(2,"0")}`;
}

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const QUALITIES = ["Auto", "1080p", "720p", "480p", "360p"];
const SLEEP_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "10 min", value: 600 },
  { label: "20 min", value: 1200 },
  { label: "30 min", value: 1800 },
  { label: "45 min", value: 2700 },
  { label: "60 min", value: 3600 },
];

function VideoPlayer({ video, initialTime = 0 }) {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const hideTimer = useRef(null);
  const sleepTimerRef = useRef(null); // ⭐ Fixed name

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [theater, setTheater] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState("Auto");
  const [cc, setCc] = useState(false);
  const [annotations, setAnnotations] = useState(true);
  const [sleepTimerVal, setSleepTimerVal] = useState(0); // ⭐ Fixed name
  const [sleepLeft, setSleepLeft] = useState(0);
  const [settingsMenu, setSettingsMenu] = useState(null);
  const lastProgressSaveRef = useRef(0);
  const completionRecordedRef = useRef(false);
  const hasStartedTrackingRef = useRef(false);

  const videoId = video?._id || video?.id;

  const saveWatchProgress = useCallback((currentTime, playerDuration, completed = false) => {
    if (!user || !videoId) return;

    watchHistoryService
      .updateWatchProgress(videoId, {
        watchedDuration: Math.max(0, Math.floor(currentTime || 0)),
        currentTime: Math.max(0, Math.floor(currentTime || 0)),
        duration: Number.isFinite(playerDuration) ? playerDuration : 0,
        completed,
      })
      .catch(() => {});
  }, [user, videoId]);

  useEffect(() => {
    lastProgressSaveRef.current = 0;
    completionRecordedRef.current = false;
    hasStartedTrackingRef.current = false;
    setCurrentTime(0);
    setDuration(0);
  }, [videoId]);

  // Auto hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, 3000);
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  // Sleep Timer
  useEffect(() => {
    clearInterval(sleepTimerRef.current);
    if (sleepTimerVal > 0) {
      setSleepLeft(sleepTimerVal);
      sleepTimerRef.current = setInterval(() => {
        setSleepLeft((prev) => {
          if (prev <= 1) {
            videoRef.current?.pause();
            clearInterval(sleepTimerRef.current);
            setSleepTimerVal(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setSleepLeft(0);
    }
    return () => clearInterval(sleepTimerRef.current);
  }, [sleepTimerVal]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          if (videoRef.current?.paused) videoRef.current.play();
          else videoRef.current?.pause();
          break;
        case "ArrowRight":
          if (videoRef.current) videoRef.current.currentTime += 10;
          break;
        case "ArrowLeft":
          if (videoRef.current) videoRef.current.currentTime -= 10;
          break;
        case "ArrowUp": {
          e.preventDefault();
          const nextVolume = Math.min(1, volume + 0.1);
          if (videoRef.current) videoRef.current.volume = nextVolume;
          setVolume(nextVolume);
          setMuted(nextVolume === 0);
          break;
        }
        case "ArrowDown": {
          e.preventDefault();
          const nextVolume = Math.max(0, volume - 0.1);
          if (videoRef.current) videoRef.current.volume = nextVolume;
          setVolume(nextVolume);
          setMuted(nextVolume === 0);
          break;
        }
        case "f":
        case "F":
          if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
          else document.exitFullscreen();
          break;
        case "m":
        case "M":
          if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setMuted(videoRef.current.muted);
          }
          break;
        case "t": case "T": setTheater((p) => !p); break;
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [volume]);

  // Fullscreen change
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    const player = videoRef.current;
    const resumeTime = Math.max(0, Number(initialTime) || 0);

    if (!player || !duration || !resumeTime) return;

    const safeResumeTime = Math.min(resumeTime, duration);
    player.currentTime = safeResumeTime;
    setCurrentTime(safeResumeTime);
  }, [duration, initialTime, videoId]);

  if (!video) return null;

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };

  const skip = (sec) => {
    if (videoRef.current) videoRef.current.currentTime += sec;
  };

  const changeVolume = (val) => {
    setVolume(val);
    if (videoRef.current) videoRef.current.volume = val;
    setMuted(val === 0);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
  };

  const handleProgress = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (videoRef.current) videoRef.current.currentTime = pos * duration;
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    if (v.buffered.length > 0) {
      setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
    }

    const watchedDuration = Math.floor(v.currentTime);
    if (watchedDuration - lastProgressSaveRef.current >= 30) {
      lastProgressSaveRef.current = watchedDuration;
      saveWatchProgress(watchedDuration, v.duration);
    }
  };

  const handlePlay = () => {
    setPlaying(true);

    if (hasStartedTrackingRef.current) return;

    const player = videoRef.current;
    hasStartedTrackingRef.current = true;
    saveWatchProgress(player?.currentTime, player?.duration);
  };

  const handlePause = () => {
    const player = videoRef.current;
    const watchedDuration = Math.floor(player?.currentTime || 0);

    setPlaying(false);

    if (watchedDuration > lastProgressSaveRef.current) {
      lastProgressSaveRef.current = watchedDuration;
      saveWatchProgress(watchedDuration, player?.duration);
    }
  };

  const handleEnded = () => {
    const watchedDuration = videoRef.current?.duration || currentTime;

    if (!completionRecordedRef.current) {
      completionRecordedRef.current = true;
      lastProgressSaveRef.current = Math.floor(watchedDuration || 0);
      saveWatchProgress(watchedDuration, videoRef.current?.duration, true);
    }

    setPlaying(false);
    setShowControls(true);
  };

  const changeSpeed = (s) => {
    setSpeed(s);
    if (videoRef.current) videoRef.current.playbackRate = s;
    setSettingsMenu(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const getVolumeIcon = () => {
    if (muted || volume === 0) return <FaVolumeMute />;
    if (volume < 0.5) return <FaVolumeDown />;
    return <FaVolumeUp />;
  };

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`vp-container ${theater ? "theater" : ""} ${fullscreen ? "fullscreen" : ""}`}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => !videoRef.current?.paused && setShowControls(false)}
      onDoubleClick={toggleFullscreen}
    >
      {/* Video */}
      <video
        ref={videoRef}
        className="vp-video"
        poster={video.thumbnail}
        src={video.videoUrl}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
      />

      {/* Center Play Icon */}
      {!playing && (
        <div className="vp-center-play" onClick={togglePlay}>
          <FaPlay />
        </div>
      )}

      {/* Sleep Badge */}
      {sleepLeft > 0 && (
        <div className="vp-sleep-badge">
          <FaMoon /> {formatTime(sleepLeft)}
        </div>
      )}

      {/* Controls */}
      <div
        className={`vp-controls ${showControls || !playing ? "visible" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div ref={progressRef} className="vp-progress" onClick={handleProgress}>
          <div className="vp-buffered" style={{ width: `${buffered}%` }} />
          <div className="vp-played" style={{ width: `${progressPct}%` }}>
            <div className="vp-thumb" />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="vp-bottom">

          {/* Left */}
          <div className="vp-left">
            <button className="vp-btn" onClick={() => skip(-10)} title="Rewind (←)">
              <FaStepBackward />
            </button>
            <button className="vp-btn play-btn" onClick={togglePlay} title="Play/Pause (Space)">
              {playing ? <FaPause /> : <FaPlay />}
            </button>
            <button className="vp-btn" onClick={() => skip(10)} title="Forward (→)">
              <FaStepForward />
            </button>
            <div className="vp-volume-group">
              <button className="vp-btn" onClick={toggleMute} title="Mute (M)">
                {getVolumeIcon()}
              </button>
              <input
                type="range"
                className="vp-vol-slider"
                min="0" max="1" step="0.05"
                value={muted ? 0 : volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
              />
            </div>
            <span className="vp-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right */}
          <div className="vp-right">
            <button
              className={`vp-btn ${cc ? "active" : ""}`}
              onClick={() => setCc(!cc)}
              title="Subtitles/CC"
            >
              <FaClosedCaptioning />
            </button>

            {/* Settings */}
            <div className="vp-settings-wrap">
              <button
                className={`vp-btn ${settingsMenu ? "active" : ""}`}
                onClick={() => setSettingsMenu(settingsMenu ? null : "main")}
                title="Settings"
              >
                <FaCog />
              </button>

              {/* Main Menu */}
              {settingsMenu === "main" && (
                <div className="vp-menu">
                  <div className="vp-menu-item" onClick={() => { setAnnotations(!annotations); setSettingsMenu(null); }}>
                    <span>Annotations</span>
                    <div className={`vp-toggle ${annotations ? "on" : ""}`} />
                  </div>
                  <div className="vp-menu-item" onClick={() => { setCc(!cc); setSettingsMenu(null); }}>
                    <span>Subtitles/CC</span>
                    <span className="vp-menu-val">{cc ? "On" : "Off"} ›</span>
                  </div>
                  <div className="vp-menu-item" onClick={() => setSettingsMenu("sleep")}>
                    <span>Sleep timer</span>
                    <span className="vp-menu-val">{sleepTimerVal === 0 ? "Off" : formatTime(sleepTimerVal)} ›</span>
                  </div>
                  <div className="vp-menu-item" onClick={() => setSettingsMenu("speed")}>
                    <span>Playback speed</span>
                    <span className="vp-menu-val">{speed === 1 ? "Normal" : `${speed}x`} ›</span>
                  </div>
                  <div className="vp-menu-item" onClick={() => setSettingsMenu("quality")}>
                    <span>Quality</span>
                    <span className="vp-menu-val">{quality} ›</span>
                  </div>
                </div>
              )}

              {/* Speed Submenu */}
              {settingsMenu === "speed" && (
                <div className="vp-menu">
                  <div className="vp-menu-back" onClick={() => setSettingsMenu("main")}>‹ Playback speed</div>
                  {SPEEDS.map((s) => (
                    <div key={s} className={`vp-menu-item ${speed === s ? "selected" : ""}`} onClick={() => changeSpeed(s)}>
                      {s === 1 ? "Normal" : `${s}x`}
                      {speed === s && <span>✓</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Quality Submenu */}
              {settingsMenu === "quality" && (
                <div className="vp-menu">
                  <div className="vp-menu-back" onClick={() => setSettingsMenu("main")}>‹ Quality</div>
                  {QUALITIES.map((q) => (
                    <div key={q} className={`vp-menu-item ${quality === q ? "selected" : ""}`} onClick={() => { setQuality(q); setSettingsMenu(null); }}>
                      {q}
                      {quality === q && <span>✓</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Sleep Submenu */}
              {settingsMenu === "sleep" && (
                <div className="vp-menu">
                  <div className="vp-menu-back" onClick={() => setSettingsMenu("main")}>‹ Sleep timer</div>
                  {SLEEP_OPTIONS.map((opt) => (
                    <div key={opt.value} className={`vp-menu-item ${sleepTimerVal === opt.value ? "selected" : ""}`} onClick={() => { setSleepTimerVal(opt.value); setSettingsMenu(null); }}>
                      {opt.label}
                      {sleepTimerVal === opt.value && <span>✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className={`vp-btn ${theater ? "active" : ""}`} onClick={() => setTheater(!theater)} title="Theater (T)">
              <FaThLarge />
            </button>
            <button className="vp-btn" onClick={toggleFullscreen} title="Fullscreen (F)">
              {fullscreen ? <FaCompress /> : <FaExpand />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
