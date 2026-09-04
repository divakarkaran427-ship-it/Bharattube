import { useCallback, useEffect, useState } from "react";
import { FaBell, FaCheck, FaComment, FaHeart, FaPlay, FaReply, FaTrashAlt, FaUserPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import notificationService from "../../services/notification.service";
import formatTimeAgo from "../../utils/formatTimeAgo";
import "./Notifications.css";

const notificationIcons = {
  subscribe: FaUserPlus,
  like: FaHeart,
  comment: FaComment,
  reply: FaReply,
  video: FaPlay,
};

function Notifications() {
  const navigate = useNavigate();
  const { unreadCount, setUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadNotifications = useCallback(async ({ pageToLoad = 1, append = false } = {}) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError("");
      const data = await notificationService.getNotifications({ page: pageToLoad, unread: unreadOnly });
      const nextNotifications = data.notifications || [];

      setNotifications((items) => (
        append ? [...items, ...nextNotifications.filter((item) => !items.some((existing) => existing._id === item._id))] : nextNotifications
      ));
      setPage(pageToLoad);
      setHasMore(pageToLoad * data.limit < data.total);
      setUnreadCount(data.unreadCount || 0);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load notifications.");
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, [setUnreadCount, unreadOnly]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markRead = async (notificationId) => {
    const notification = notifications.find((item) => item._id === notificationId);
    if (!notification || notification.isRead) return;

    try {
      setWorkingId(notificationId);
      await notificationService.markAsRead(notificationId);
      setNotifications((items) => items.map((item) => (
        item._id === notificationId ? { ...item, isRead: true } : item
      )));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update notification.");
    } finally {
      setWorkingId("");
    }
  };

  const openNotification = async (notification) => {
    await markRead(notification._id);
    if (notification.video?._id) navigate(`/watch/${notification.video._id}`);
  };

  const markAllRead = async () => {
    try {
      setMarkingAll(true);
      await notificationService.markAllAsRead();
      setNotifications((items) => (unreadOnly ? [] : items.map((item) => ({ ...item, isRead: true }))));
      setUnreadCount(0);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to mark notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  const removeNotification = async (notificationId) => {
    const notification = notifications.find((item) => item._id === notificationId);

    try {
      setWorkingId(notificationId);
      await notificationService.deleteNotification(notificationId);
      setNotifications((items) => items.filter((item) => item._id !== notificationId));
      if (notification && !notification.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete notification.");
    } finally {
      setWorkingId("");
    }
  };

  const loadMore = () => loadNotifications({ pageToLoad: page + 1, append: true });

  return (
    <main className="notifications-page">
      <header className="notifications-header">
        <div>
          <p><FaBell aria-hidden="true" /> Account</p>
          <h1>Notifications</h1>
          <span>{unreadCount ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "You are all caught up"}</span>
        </div>
        <button type="button" onClick={markAllRead} disabled={markingAll || unreadCount === 0}>
          <FaCheck aria-hidden="true" /> {markingAll ? "Updating…" : "Mark all as read"}
        </button>
      </header>

      <div className="notifications-filter" role="group" aria-label="Notification filter">
        <button type="button" className={!unreadOnly ? "active" : ""} onClick={() => setUnreadOnly(false)}>All</button>
        <button type="button" className={unreadOnly ? "active" : ""} onClick={() => setUnreadOnly(true)}>Unread</button>
      </div>

      {error && <p className="notifications-error" role="alert">{error}</p>}

      {loading ? (
        <section className="notifications-state" role="status">Loading notifications…</section>
      ) : notifications.length > 0 ? (
        <section className="notifications-list" aria-label="Your notifications">
          {notifications.map((notification) => {
            const Icon = notificationIcons[notification.type] || FaBell;
            const senderName = notification.sender?.name || "BharatTube user";
            const senderInitial = senderName.trim().charAt(0).toUpperCase();

            return (
              <article key={notification._id} className={`notification-item ${notification.isRead ? "" : "notification-item--unread"}`}>
                <button type="button" className="notification-main" onClick={() => openNotification(notification)}>
                  <span className="notification-avatar">
                    {notification.sender?.profilePhoto ? <img src={notification.sender.profilePhoto} alt="" /> : senderInitial}
                  </span>
                  <span className="notification-copy">
                    <strong>{notification.message}</strong>
                    <small>{formatTimeAgo(notification.createdAt)}</small>
                  </span>
                  {notification.video?.thumbnail && <img className="notification-thumbnail" src={notification.video.thumbnail} alt="" />}
                  <span className={`notification-type notification-type--${notification.type}`} aria-label={notification.type}><Icon aria-hidden="true" /></span>
                </button>
                <button
                  type="button"
                  className="notification-delete"
                  onClick={() => removeNotification(notification._id)}
                  disabled={workingId === notification._id}
                  aria-label="Delete notification"
                >
                  <FaTrashAlt aria-hidden="true" />
                </button>
              </article>
            );
          })}
          {hasMore && (
            <button type="button" className="notifications-load-more" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </section>
      ) : (
        <section className="notifications-state notifications-state--empty">
          <FaBell aria-hidden="true" />
          <h2>{unreadOnly ? "No unread notifications" : "No notifications yet"}</h2>
          <p>{unreadOnly ? "You are up to date." : "Likes, comments, replies and new subscribers will appear here."}</p>
        </section>
      )}
    </main>
  );
}

export default Notifications;
