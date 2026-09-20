import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBars,
  FaBell,
  FaChartBar,
  FaChevronDown,
  FaCommentAlt,
  FaCog,
  FaCreditCard,
  FaClock,
  FaHistory,
  FaLanguage,
  FaList,
  FaPalette,
  FaPlus,
  FaQuestionCircle,
  FaSearch,
  FaSignOutAlt,
  FaThumbsUp,
  FaUserCircle,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { useSidebar } from "../../context/SidebarContext";
import searchHistoryService from "../../services/searchHistory.service";
import VoiceSearch from "../VoiceSearch/VoiceSearch";
import "./Navbar.css";

function Navbar() {
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);
  const profileTriggerRef = useRef(null);
  const profileItemRefs = useRef([]);
  const { toggleSidebar } = useSidebar();
 const {
  user,
  channel,
  hasChannel,
  logout,
} = useAuth();
  const { unreadCount } = useNotifications();

  useEffect(() => {
    const closeProfileMenu = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", closeProfileMenu);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeProfileMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [user?.profilePhoto]);

  const handleSearch = () => {
    const keyword = search.trim();

    if (window.matchMedia("(max-width: 576px)").matches && !keyword) {
      navigate("/search");
      return;
    }

    if (!keyword) {
      navigate("/");
      return;
    }

    if (user) {
      searchHistoryService.recordSearch(keyword).catch(() => {});
    }

    navigate(`/search?q=${encodeURIComponent(keyword)}`);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") handleSearch();
  };

  const handleVoiceSearch = (text) => {
    setSearch(text);

    if (user) {
      searchHistoryService.recordSearch(text).catch(() => {});
    }

    navigate(`/search?q=${encodeURIComponent(text)}`);
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate("/login");
  };

  const goToNotifications = () => {
    setProfileOpen(false);
    navigate("/notifications");
  };

  const goToProfileRoute = (path) => {
    setProfileOpen(false);
    navigate(path);
  };

  const focusProfileItem = (index) => {
    window.requestAnimationFrame(() => profileItemRefs.current[index]?.focus());
  };

  const openProfileMenu = () => {
    setProfileOpen(true);
  };

  const handleProfileKeyDown = (event) => {
    const enabledItems = profileItemRefs.current.filter(Boolean);
    const currentIndex = enabledItems.indexOf(document.activeElement);

    if (event.key === "Escape") {
      event.preventDefault();
      setProfileOpen(false);
      profileTriggerRef.current?.focus();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = currentIndex === -1
        ? 0
        : (currentIndex + direction + enabledItems.length) % enabledItems.length;
      enabledItems[nextIndex]?.focus();
    }
  };

  const initial = user?.name?.trim().charAt(0).toUpperCase() || "U";
  const hasProfilePhoto = Boolean(user?.profilePhoto) && !imageLoadFailed;
  const username = user?.username || user?.email || "@bharattube";

  const profileMenuItems = [
   {
  key: hasChannel ? "view-channel" : "create-channel",
  label: hasChannel ? "View Your Channel" : "Create Channel",
  icon: <FaUserCircle aria-hidden="true" />,
  onClick: () => {
    setProfileOpen(false);

    if (hasChannel && channel?.handle) {
      navigate(`/channel/${channel.handle}`);
    } else {
      navigate("/create-channel");
    }
  },
},
   {
   key:"edit-channel",
   label:"Edit Channel",
   icon:<FaCog />,
   onClick:()=>goToProfileRoute("/channel/edit")
  },
    {
      key: "creator-studio",
      label: "Creator Studio",
      icon: <FaChartBar aria-hidden="true" />,
      onClick: () => goToProfileRoute("/studio"),
    },
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <FaChartBar aria-hidden="true" />,
      onClick: () => goToProfileRoute("/dashboard"),
    },
    {
      key: "wallet",
      label: "Wallet",
      icon: <FaCreditCard aria-hidden="true" />,
      onClick: () => goToProfileRoute("/wallet"),
    },
    {
      key: "history",
      label: "History",
      icon: <FaHistory aria-hidden="true" />,
      onClick: () => goToProfileRoute("/history"),
    },
    {
      key: "liked-videos",
      label: "Liked Videos",
      icon: <FaThumbsUp aria-hidden="true" />,
      onClick: () => goToProfileRoute("/liked-videos"),
    },
    {
      key: "playlists",
      label: "Playlists",
      icon: <FaList aria-hidden="true" />,
      onClick: () => goToProfileRoute("/playlists"),
    },
    {
      key: "watch-later",
      label: "Watch Later",
      icon: <FaClock aria-hidden="true" />,
      onClick: () => goToProfileRoute("/watch-later"),
    },
    {
      key: "settings",
      label: "Settings",
      icon: <FaCog aria-hidden="true" />,
      onClick: () => goToProfileRoute("/settings"),
    },
    {
      key: "appearance",
      label: "Appearance",
      icon: <FaPalette aria-hidden="true" />,
      onClick: () => goToProfileRoute("/appearance"),
    },
    {
      key: "language",
      label: "Language",
      icon: <FaLanguage aria-hidden="true" />,
      onClick: () => goToProfileRoute("/language"),
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: <FaBell aria-hidden="true" />,
      onClick: () => goToProfileRoute("/notifications"),
    },
    {
      key: "help",
      label: "Help",
      icon: <FaQuestionCircle aria-hidden="true" />,
      onClick: () => goToProfileRoute("/help"),
    },
    {
      key: "feedback",
      label: "Feedback",
      icon: <FaCommentAlt aria-hidden="true" />,
      onClick: () => goToProfileRoute("/feedback"),
    },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button type="button" className="menu-btn" onClick={toggleSidebar} aria-label="Toggle menu">
          <FaBars className="nav-icon" />
        </button>
        <h2 className="logo" onClick={() => navigate("/")}><span>Bharat</span>Tube</h2>
      </div>

      <div className="navbar-center">
        <div className="search-box">
          <input type="text" placeholder="Search videos..." value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={handleKeyDown} />
          <button type="button" onClick={handleSearch} aria-label="Search videos"><FaSearch /></button>
        </div>
        <VoiceSearch onSearch={handleVoiceSearch} />
      </div>

      <div className="navbar-right">
        <button type="button" className="upload-btn" onClick={() => navigate("/create")}><FaPlus /><span>Upload</span></button>
        <button
          type="button"
          className="notification-nav-button"
          onClick={goToNotifications}
          aria-label={unreadCount ? `Open notifications, ${unreadCount} unread` : "Open notifications"}
        >
          <FaBell className="nav-icon" />
          {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        </button>

        <div className="profile-menu" ref={profileMenuRef} onKeyDown={handleProfileKeyDown}>
          <button
            ref={profileTriggerRef}
            type="button"
            className="profile-trigger"
            onClick={() => setProfileOpen((open) => !open)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                openProfileMenu();
                focusProfileItem(0);
              }
            }}
            aria-label="Open profile menu"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            aria-controls="profile-dropdown-menu"
          >
            <span className="profile-avatar">
              {hasProfilePhoto ? (
                <img src={user.profilePhoto} alt={`${user.name}'s profile`} onError={() => setImageLoadFailed(true)} />
              ) : user ? (
                initial
              ) : (
                <FaUserCircle aria-hidden="true" />
              )}
            </span>
            <FaChevronDown className="profile-chevron" aria-hidden="true" />
          </button>

          {profileOpen && (
            <div id="profile-dropdown-menu" className="profile-dropdown" role="menu" aria-label="Account menu">
              {user ? (
                <>
                  <div className="profile-dropdown-user">
                    <span className="profile-dropdown-avatar">
                      {hasProfilePhoto ? <img src={user.profilePhoto} alt="" /> : initial}
                    </span>
                    <span>
                      <strong>{user.name}</strong>
                      <small>{username}</small>
                    </span>
                  </div>
                  <div className="profile-dropdown-divider" />

                  {profileMenuItems.map((item, index) => (
                    <button
                      key={item.key}
                      ref={(element) => {
                        profileItemRefs.current[index] = element;
                      }}
                      type="button"
                      role="menuitem"
                      onClick={item.onClick}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}

                  <div className="profile-dropdown-divider" />
                  <button
                    ref={(element) => {
                      profileItemRefs.current[profileMenuItems.length] = element;
                    }}
                    type="button"
                    role="menuitem"
                    className="profile-logout"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt aria-hidden="true" />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  ref={(element) => {
                    profileItemRefs.current[0] = element;
                  }}
                  type="button"
                  role="menuitem"
                  onClick={() => navigate("/login")}
                >
                  Login to BharatTube
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
