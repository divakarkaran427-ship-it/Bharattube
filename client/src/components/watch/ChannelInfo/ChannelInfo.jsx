import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaBell, FaBellSlash, FaChevronDown, FaUserMinus } from "react-icons/fa";
import subscriptionService from "../../../services/subscription.service";
import "./ChannelInfo.css";

function formatSubscribers(count) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count;
}

function ChannelInfo({ channel }) {
  const navigate = useNavigate();
  const [subscribers, setSubscribers] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [notifyOption, setNotifyOption] = useState("all");
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!channel?._id) {
      setSubscribers(0);
      setSubscribed(false);
      return;
    }

    const loadSubscribers = async () => {
      try {
        const data = await subscriptionService.getSubscribers(channel._id);
        const info = data.data || data;
        setSubscribers(info.totalSubscribers ?? info.subscribers ?? 0);
        setSubscribed(info.isSubscribed ?? false);
      } catch (err) {
        console.log(err);
      }
    };
    loadSubscribers();
  }, [channel?._id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!channel) return null;

  const channelHandle = channel.handle;

  const openChannel = () => {
    if (channelHandle) {
      navigate(`/channel/${channelHandle}`);
    }
  };

  const handleChannelKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openChannel();
    }
  };

  const handleSubscribe = async () => {
    if (loading) return;
    const prev = subscribed;
    const prevCount = subscribers;
    setSubscribed(!prev);
    setSubscribers(prev ? prevCount - 1 : prevCount + 1);
    try {
      setLoading(true);
      const data = await subscriptionService.toggleSubscription(channel._id);
      const info = data.data || data;
      setSubscribers(info.subscribers ?? info.totalSubscribers ?? prevCount);
      setSubscribed(info.isSubscribed ?? !prev);
      if (!prev) setNotifyOption("all");
    } catch (err) {
      setSubscribed(prev);
      setSubscribers(prevCount);
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setShowDropdown(false);
    await handleSubscribe();
  };

  const getNotifyIcon = () => {
    if (notifyOption === "none") return <FaBellSlash />;
    return <FaBell />;
  };

  return (
    <div className="channel-info">

      {/* Left - Avatar + Details */}
      <div
        className="channel-left"
        role={channelHandle ? "link" : undefined}
        tabIndex={channelHandle ? 0 : undefined}
        aria-label={channelHandle ? `Open ${channel.channelName} channel` : undefined}
        onClick={openChannel}
        onKeyDown={handleChannelKeyDown}
      >
        <img
          className="channel-avatar"
          src={channel.logo || "https://via.placeholder.com/80"}
          alt={channel.channelName}
        />
        <div className="channel-details">
          <div className="channel-name-row">
            <h3>{channel.channelName}</h3>
            {channel.verified && <FaCheckCircle className="verified-badge" />}
          </div>
          <span className="subscriber-text">
            {formatSubscribers(subscribers)} subscribers
          </span>
        </div>
      </div>

      {/* Right - Subscribe Button */}
      <div className="subscribe-wrapper" ref={dropdownRef}>

        {!subscribed ? (
          // ===== NOT SUBSCRIBED =====
          <button
            className="subscribe-btn"
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? "Please wait..." : "Subscribe"}
          </button>
        ) : (
          // ===== SUBSCRIBED =====
          <div className="subscribed-group">
            {/* Bell + Notify option */}
            <button
              className="subscribed-btn"
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={loading}
            >
              {getNotifyIcon()}
              <span>Subscribed</span>
              <FaChevronDown className={`chevron ${showDropdown ? "open" : ""}`} />
            </button>
          </div>
        )}

        {/* Dropdown Menu */}
        {showDropdown && subscribed && (
          <div className="notify-dropdown">
            <p className="dropdown-label">Notifications</p>

            <button
              className={`dropdown-item ${notifyOption === "all" ? "active" : ""}`}
              onClick={() => { setNotifyOption("all"); setShowDropdown(false); }}
            >
              <FaBell />
              <div>
                <span>All</span>
                <small>All new videos</small>
              </div>
            </button>

            <button
              className={`dropdown-item ${notifyOption === "personalized" ? "active" : ""}`}
              onClick={() => { setNotifyOption("personalized"); setShowDropdown(false); }}
            >
              <FaBell />
              <div>
                <span>Personalized</span>
                <small>Recommended videos</small>
              </div>
            </button>

            <button
              className={`dropdown-item ${notifyOption === "none" ? "active" : ""}`}
              onClick={() => { setNotifyOption("none"); setShowDropdown(false); }}
            >
              <FaBellSlash />
              <div>
                <span>None</span>
                <small>No notifications</small>
              </div>
            </button>

            <div className="dropdown-divider" />

            <button className="dropdown-item danger" onClick={handleUnsubscribe}>
              <FaUserMinus />
              <div>
                <span>Unsubscribe</span>
              </div>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default ChannelInfo;
