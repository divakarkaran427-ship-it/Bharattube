import { useState, useEffect } from "react";
import { FaChevronDown, FaChevronUp, FaReply, FaThumbsUp, FaUserCircle } from "react-icons/fa";
import commentService from "../../../services/comment.service";
import { useAuth } from "../../../context/AuthContext";
import formatTimeAgo from "../../../utils/formatTimeAgo";
import "./Comments.css";

// =====================
// Single Comment
// =====================
function CommentItem({ comment, videoId, onReply, onLikeToggle, user, depth = 0 }) {
  const [replyText, setReplyText] = useState("");
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [liked, setLiked] = useState(
    Array.isArray(comment.likes)
      ? comment.likes.some((id) => id?.toString?.() === user?._id?.toString())
      : false
  );

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    if (!user) return alert("Please login to reply!");

    try {
      setReplying(true);
      await onReply(videoId, comment._id, replyText.trim());
      setReplyText("");
      setShowReplyBox(false);
      setShowReplies(true);
    } catch (error) {
      console.error(error);
    } finally {
      setReplying(false);
    }
  };

  const replyCount = (replies) => (replies || []).reduce(
    (count, reply) => count + 1 + replyCount(reply.replies),
    0
  );
  const totalReplies = replyCount(comment.replies);
  const canToggleReplies = depth === 0 && totalReplies > 0;

  const handleLike = async () => {
    if (!user) return alert("Please login to like comments!");

    try {
      const response = await onLikeToggle(comment._id, liked);
      setLiked(!liked);
      comment.likesCount = response.likesCount || 0;
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      className={`comment-item ${depth > 0 ? "comment-item-nested" : ""}`}
      style={{ marginLeft: depth > 0 ? 18 : 0 }}
    >
      <div className="comment-avatar">
        {comment.user?.profilePhoto ? (
          <img src={comment.user.profilePhoto} alt={comment.user.name} />
        ) : (
          <FaUserCircle className="default-avatar" />
        )}
      </div>

      <div className="comment-body">
        <div className="comment-header">
          <span className="comment-username">{comment.user?.name}</span>
          <span className="comment-time">{formatTimeAgo(comment.createdAt)}</span>
        </div>

        <p className="comment-text">{comment.text}</p>

        <div className="comment-actions">
          <button className={`comment-action-btn ${liked ? "active" : ""}`} onClick={handleLike}>
            <FaThumbsUp />
            <span>{comment.likesCount || 0}</span>
          </button>

          <button className="comment-action-btn" onClick={() => setShowReplyBox((current) => !current)}>
            <FaReply />
            <span>Reply</span>
          </button>
        </div>

        {showReplyBox && (
          <div className="reply-box">
            <input
              type="text"
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              placeholder="Write a reply..."
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleReplySubmit();
                }
              }}
            />
            <button type="button" onClick={handleReplySubmit} disabled={replying || !replyText.trim()}>
              {replying ? "Replying..." : "Reply"}
            </button>
          </div>
        )}

        {canToggleReplies && (
          <button
            type="button"
            className="replies-toggle"
            onClick={() => setShowReplies((visible) => !visible)}
            aria-expanded={showReplies}
          >
            <span>{showReplies ? "Hide" : "View"} {totalReplies} {totalReplies === 1 ? "reply" : "replies"}</span>
            {showReplies ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
          </button>
        )}

        {Array.isArray(comment.replies) && comment.replies.length > 0 && (depth > 0 || showReplies) && (
          <div className="comment-replies">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                videoId={videoId}
                onReply={onReply}
                onLikeToggle={onLikeToggle}
                user={user}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================
// Comments Section
// =====================
function Comments({ videoId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [totalComments, setTotalComments] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!videoId) return;
    fetchComments();
  }, [videoId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await commentService.getComments(videoId);
      setComments(res.comments || []);
      setTotalComments(res.totalComments || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    if (!user) return alert("Please login to comment!");

    try {
      setSubmitting(true);
      const res = await commentService.addComment(videoId, text);

      setComments((prev) => [res.comment, ...prev]);
      setTotalComments((prev) => prev + 1);
      setText("");
      setFocused(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateCommentTree = (commentsList, commentId, updater) => {
    return commentsList.map((comment) => {
      if (comment._id === commentId) {
        return updater(comment);
      }

      if (Array.isArray(comment.replies) && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentTree(comment.replies, commentId, updater),
        };
      }

      return comment;
    });
  };

  const handleReply = async (replyVideoId, parentCommentId, replyText) => {
    const res = await commentService.addReply(replyVideoId, parentCommentId, replyText);
    const newReply = res.comment;

    setComments((prev) => updateCommentTree(prev, parentCommentId, (comment) => ({
      ...comment,
      replies: [...(comment.replies || []), newReply],
      repliesCount: (comment.repliesCount || 0) + 1,
    })));
  };

  const handleLikeToggle = async (commentId, liked) => {
    const res = liked
      ? await commentService.removeLikeComment(commentId)
      : await commentService.toggleLikeComment(commentId);

    setComments((prev) => updateCommentTree(prev, commentId, (comment) => ({
      ...comment,
      likesCount: res.likesCount || 0,
      likes: liked ? comment.likes?.filter((id) => id?.toString?.() !== user?._id?.toString()) : [...(comment.likes || []), user?._id],
    })));

    return res;
  };

  const handleCancel = () => {
    setText("");
    setFocused(false);
  };

  return (
    <div className="comments-section">

      {/* Header */}
      <h3 className="comments-title">
        {totalComments} Comments
      </h3>

      {/* Add Comment */}
      <div className="add-comment">
        <div className="comment-avatar">
          {user?.profilePhoto ? (
            <img src={user.profilePhoto} alt={user.name} />
          ) : (
            <FaUserCircle className="default-avatar" />
          )}
        </div>

        <div className="comment-input-wrapper">
          <input
            className={`comment-input ${focused ? "focused" : ""}`}
            type="text"
            placeholder="Add a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />

          {focused && (
            <div className="comment-btns">
              <button className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={!text.trim() || submitting}
              >
                {submitting ? "Posting..." : "Comment"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="comments-loading">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="no-comments">
          No comments yet. Be the first to comment! 💬
        </div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              videoId={videoId}
              user={user}
              onReply={handleReply}
              onLikeToggle={handleLikeToggle}
            />
          ))}
        </div>
      )}

    </div>
  );
}

export default Comments;
