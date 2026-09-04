import { useState, useRef, useEffect } from "react";
import {
  FaThumbsUp,
  FaThumbsDown,
  FaShare,
  FaEllipsisH,
  FaBookmark,
  FaDownload,
  FaFlag,
  FaBell,
  FaClock,
} from "react-icons/fa";

import reactionService from "../../../services/reaction.service";
import watchLaterService from "../../../services/watchLater.service";
import { useAuth } from "../../../context/AuthContext";
import PlaylistModal from "../../PlaylistModal/PlaylistModal";
import "./ActionButtons.css";

function ActionButtons({ video }) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [reaction, setReaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!video) {
      setLikes(0);
      setDislikes(0);
      setReaction(null);
      return;
    }

    const nextLikes = Number(video.likes?.length || video.likesCount || 0);
    const nextDislikes = Number(video.dislikes?.length || video.dislikesCount || 0);

    setLikes(nextLikes);
    setDislikes(nextDislikes);

    if (!user?._id) {
      setReaction(null);
      return;
    }

    const hasLiked = Array.isArray(video.likes)
      ? video.likes.some((id) => id?.toString?.() === user._id.toString())
      : false;

    const hasDisliked = Array.isArray(video.dislikes)
      ? video.dislikes.some((id) => id?.toString?.() === user._id.toString())
      : false;

    setReaction(hasLiked ? "like" : hasDisliked ? "dislike" : null);
  }, [video, user?._id]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!video) return null;

  const handleLike = async () => {
    if (loading) return;

    if (!user) {
      alert("Please log in to like videos.");
      return;
    }

    try {
      setLoading(true);
      if (reaction === "like") {
        const res = await reactionService.removeReaction(video._id);
        setLikes(res.likes);
        setDislikes(res.dislikes);
        setReaction(null);
      } else {
        const res = await reactionService.likeVideo(video._id);
        setLikes(res.likes);
        setDislikes(res.dislikes);
        setReaction("like");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Unable to update like state.");
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
    if (loading) return;

    if (!user) {
      alert("Please log in to dislike videos.");
      return;
    }

    try {
      setLoading(true);
      if (reaction === "dislike") {
        const res = await reactionService.removeReaction(video._id);
        setLikes(res.likes);
        setDislikes(res.dislikes);
        setReaction(null);
      } else {
        const res = await reactionService.dislikeVideo(video._id);
        setLikes(res.likes);
        setDislikes(res.dislikes);
        setReaction("dislike");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Unable to update dislike state.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = video.videoUrl;
    a.download = video.title;
    a.target = "_blank";
    a.click();
  };

  const handleSave = () => {
    if (!user) {
      alert("Please log in to save videos.");
      return;
    }

    setShowPlaylistModal(true);
  };

  const handleWatchLater = async () => {
    if (!user) {
      alert("Please log in to save videos for later.");
      return;
    }

    try {
      await watchLaterService.addToWatchLater(video._id);
      alert("Added to Watch Later.");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Unable to add this video to Watch Later.");
    }
  };

  const handleReport = () => {
    alert("Video reported!");
  };

  return (
    <div className="action-buttons">

      {/* Like + Dislike — joined pill */}
      <div className="like-dislike-group">
        <button
          className={`action-btn like-btn ${reaction === "like" ? "active" : ""} ${loading ? "loading" : ""}`}
          onClick={handleLike}
        >
          <FaThumbsUp />
          <span>{likes}</span>
        </button>

        <div className="divider" />

        <button
          className={`action-btn dislike-btn ${reaction === "dislike" ? "active" : ""} ${loading ? "loading" : ""}`}
          onClick={handleDislike}
        >
          <FaThumbsDown />
          <span>{dislikes}</span>
        </button>
      </div>

      {/* Share */}
      <button className="action-btn" onClick={handleShare}>
        <FaShare />
        <span>Share</span>
      </button>

      {/* 3 Dot Menu */}
      <div className="more-menu-wrapper" ref={menuRef}>
        <button
          className={`action-btn ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <FaEllipsisH />
        </button>

        {menuOpen && (
          <div className="more-menu">
            <button className="more-menu-item" onClick={() => { handleSave(); setMenuOpen(false); }}>
              <FaBookmark />
              <span>Save</span>
            </button>

            <button className="more-menu-item" onClick={() => { handleWatchLater(); setMenuOpen(false); }}>
              <FaClock />
              <span>Watch Later</span>
            </button>

            <button className="more-menu-item" onClick={() => { handleDownload(); setMenuOpen(false); }}>
              <FaDownload />
              <span>Download</span>
            </button>

            <button className="more-menu-item" onClick={() => { setMenuOpen(false); }}>
              <FaBell />
              <span>Add to Notifications</span>
            </button>

            <div className="more-menu-divider" />

            <button className="more-menu-item danger" onClick={() => { handleReport(); setMenuOpen(false); }}>
              <FaFlag />
              <span>Report</span>
            </button>
          </div>
        )}
      </div>

      <PlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        videoId={video._id}
        onSaved={() => {
          setShowPlaylistModal(false);
          alert("Video saved to playlist.");
        }}
      />

    </div>
  );
}

export default ActionButtons;
