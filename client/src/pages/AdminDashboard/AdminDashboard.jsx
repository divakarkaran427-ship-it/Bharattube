import React, { useCallback, useEffect, useState } from "react";
import {
  FiGrid,
  FiUsers,
  FiVideo,
  FiFlag,
  FiSettings,
  FiSearch,
  FiBell,
  FiChevronDown,
  FiEye,
  FiPlayCircle,
  FiActivity,
  FiMenu,
  FiRefreshCw,
} from "react-icons/fi";
import adminService from "../../services/admin.service";
import "./AdminDashboard.css";

const formatNumber = (value) => new Intl.NumberFormat("en-IN").format(value);

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      setDashboard(await adminService.getDashboard());
    } catch (loadError) {
      setDashboard(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = dashboard?.stats;

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">▶</div>
          <span>
            Bharat<span>Tube</span>
          </span>
        </div>

        <div className="admin-menu-title">MENU</div>

        <nav className="admin-nav">
          <a href="/admin" className="admin-nav-item active">
            <FiGrid />
            <span>Dashboard</span>
          </a>

          <span className="admin-nav-item unavailable" aria-disabled="true">
            <FiUsers />
            <span>Users</span>
          </span>

          <span className="admin-nav-item unavailable" aria-disabled="true">
            <FiVideo />
            <span>Videos</span>
          </span>

          <span className="admin-nav-item unavailable" aria-disabled="true">
            <FiFlag />
            <span>Reports</span>
          </span>

          <div className="admin-menu-title admin-menu-spacer">SYSTEM</div>

          <span className="admin-nav-item unavailable" aria-disabled="true">
            <FiSettings />
            <span>Settings</span>
          </span>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-status-dot"></div>
          <div>
            <strong>Admin Panel</strong>
            <span>BharatTube</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="admin-mobile-menu">
            <FiMenu />
          </div>

          <div className="admin-search">
            <FiSearch />
            <input
              type="text"
              placeholder="Search dashboard..."
              aria-label="Search dashboard"
            />
          </div>

          <div className="admin-top-actions">
            <button className="admin-icon-button" aria-label="Notifications">
              <FiBell />
              <span className="admin-notification-dot"></span>
            </button>

            <div className="admin-profile">
              <div className="admin-profile-avatar">A</div>

              <div className="admin-profile-info">
                <strong>Admin</strong>
                <span>Administrator</span>
              </div>

              <FiChevronDown className="admin-profile-arrow" />
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="admin-content">
          <div className="admin-page-heading">
            <div>
              <h1>Dashboard</h1>
              <p>Welcome to your BharatTube administration panel.</p>
            </div>

            <div className="admin-live-status">
              <span></span>
              System Online
            </div>
          </div>

          {loading && (
            <div className="admin-dashboard-status" role="status">
              Loading dashboard data...
            </div>
          )}

          {error && (
            <div className="admin-dashboard-status error" role="alert">
              <span>Unable to load dashboard data</span>
              <button type="button" onClick={loadDashboard}>
                <FiRefreshCw /> Retry
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon users">
                <FiUsers />
              </div>

              <div className="admin-stat-content">
                <span>Total Users</span>
                <strong>{stats ? formatNumber(stats.totalUsers) : "—"}</strong>
                <small>{loading ? "Loading" : "Live data"}</small>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon videos">
                <FiVideo />
              </div>

              <div className="admin-stat-content">
                <span>Total Videos</span>
                <strong>{stats ? formatNumber(stats.totalVideos) : "—"}</strong>
                <small>{loading ? "Loading" : "Live data"}</small>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon shorts">
                <FiPlayCircle />
              </div>

              <div className="admin-stat-content">
                <span>Total Shorts</span>
                <strong>{stats ? formatNumber(stats.totalShorts) : "—"}</strong>
                <small>{loading ? "Loading" : "Live data"}</small>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon views">
                <FiEye />
              </div>

              <div className="admin-stat-content">
                <span>Total Views</span>
                <strong>{stats ? formatNumber(stats.totalViews) : "—"}</strong>
                <small>{loading ? "Loading" : "Live data"}</small>
              </div>
            </div>
          </div>

          {/* Overview */}
          <div className="admin-overview-grid">
            <div className="admin-panel admin-activity-panel">
              <div className="admin-panel-header">
                <div>
                  <h2>Platform Overview</h2>
                  <p>Current BharatTube activity</p>
                </div>

                <div className="admin-panel-icon">
                  <FiActivity />
                </div>
              </div>

              <div className="admin-overview-summary">
                <div className="admin-overview-row">
                  <span>Registered users</span>
                  <strong>{stats ? formatNumber(stats.totalUsers) : "—"}</strong>
                </div>
                <div className="admin-overview-row">
                  <span>Published videos</span>
                  <strong>{stats ? formatNumber(stats.totalVideos) : "—"}</strong>
                </div>
                <div className="admin-overview-row">
                  <span>Uploaded Shorts</span>
                  <strong>{stats ? formatNumber(stats.totalShorts) : "—"}</strong>
                </div>
                <div className="admin-overview-row">
                  <span>Total recorded views</span>
                  <strong>{stats ? formatNumber(stats.totalViews) : "—"}</strong>
                </div>
              </div>
            </div>

            <div className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h2>Quick Overview</h2>
                  <p>Administration status</p>
                </div>
              </div>

              <div className="admin-quick-list">
                <div className="admin-quick-item">
                  <div className="admin-quick-icon">
                    <FiUsers />
                  </div>

                  <div>
                    <strong>Users</strong>
                    <span>{stats ? `${formatNumber(stats.totalUsers)} registered users` : "Loading user count"}</span>
                  </div>
                </div>

                <div className="admin-quick-item">
                  <div className="admin-quick-icon">
                    <FiVideo />
                  </div>

                  <div>
                    <strong>Content</strong>
                    <span>{stats ? `${formatNumber(stats.totalVideos)} videos and ${formatNumber(stats.totalShorts)} Shorts` : "Loading content counts"}</span>
                  </div>
                </div>

                <div className="admin-quick-item">
                  <div className="admin-quick-icon">
                    <FiFlag />
                  </div>

                  <div>
                    <strong>Reports</strong>
                    <span>{dashboard?.reports?.message || "Reports system not connected yet"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="admin-panel admin-recent-panel">
            <div className="admin-panel-header">
              <div>
                <h2>Recent Activity</h2>
                <p>Latest platform activity</p>
              </div>
            </div>

            {dashboard?.recentActivity?.length ? (
              <div className="admin-activity-list">
                {dashboard.recentActivity.map((activity) => (
                  <div className="admin-activity-item" key={`${activity.type}-${activity.id}`}>
                    <div className="admin-activity-icon">
                      {activity.type === "user" ? <FiUsers /> : <FiVideo />}
                    </div>
                    <div className="admin-activity-copy">
                      <strong>{activity.title}</strong>
                      <span>{activity.detail}{activity.channelName ? ` · ${activity.channelName}` : ""}</span>
                    </div>
                    <time dateTime={activity.createdAt}>{formatDate(activity.createdAt)}</time>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">
                  <FiActivity />
                </div>
                <h3>No recent activity</h3>
                <p>No users or uploads have been recorded yet.</p>
              </div>
            )}
          </div>

          <footer className="admin-footer">
            <span>© 2026 BharatTube</span>
            <span>Admin Dashboard</span>
          </footer>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;