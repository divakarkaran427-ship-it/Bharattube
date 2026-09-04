import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaChartLine,
  FaClock,
  FaEdit,
  FaEye,
  FaHeart,
  FaLock,
  FaPlay,
  FaPlus,
  FaRupeeSign,
  FaUsers,
  FaVideo,
} from "react-icons/fa";
import dashboardService from "../../services/dashboard.service";
import "./CreatorDashboard.css";

const formatNumber = (value = 0) => new Intl.NumberFormat("en-IN", {
  notation: value >= 1000 ? "compact" : "standard",
  maximumFractionDigits: 1,
}).format(value);

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(parsedDate);
};

const formatVisibility = (visibility) => {
  if (!visibility) return "Unspecified";
  return `${visibility.charAt(0).toUpperCase()}${visibility.slice(1)}`;
};

function OverviewCard({ icon: Icon, label, value, detail, tone }) {
  return (
    <article className={`studio-metric studio-metric--${tone}`}>
      <span className="studio-metric-icon" aria-hidden="true"><Icon /></span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </article>
  );
}

function CreatorDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [dashboardData, studioVideosData] = await Promise.all([
        dashboardService.getStudioDashboard(),
        dashboardService.getStudioVideos(),
      ]);

      setDashboard(dashboardData);
      setRecentVideos(studioVideosData.videos);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load your Studio dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const scrollToAnalytics = () => {
    document.getElementById("studio-analytics")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <main className="creator-dashboard">
        <div className="studio-dashboard-loading" role="status" aria-live="polite">
          <span className="studio-loader" aria-hidden="true" /> Loading your Studio…
        </div>
      </main>
    );
  }

  if (error || !dashboard) {
    return (
      <main className="creator-dashboard">
        <section className="studio-dashboard-error studio-dashboard-error--page" role="alert">
          <p>{error || "Your Studio dashboard is unavailable."}</p>
          <button type="button" onClick={loadDashboard}>Try again</button>
        </section>
      </main>
    );
  }

  return (
    <main className="creator-dashboard">
      <section className="creator-dashboard-inner" aria-labelledby="studio-title">
        <header className="studio-dashboard-header">
          <div>
            <p className="studio-kicker">BHARATTUBE STUDIO</p>
            <h1 id="studio-title">{dashboard.channelName}</h1>
            <p>Manage your channel, understand performance, and publish your next video.</p>
          </div>
          <button type="button" className="studio-upload-button" onClick={() => navigate("/upload")}>
            <FaPlus aria-hidden="true" /> Upload video
          </button>
        </header>

        <section className="studio-overview" aria-labelledby="overview-title">
          <div className="studio-section-heading">
            <div>
              <p className="studio-kicker">OVERVIEW</p>
              <h2 id="overview-title">Channel performance</h2>
            </div>
            <span className="studio-live-dot">Live data</span>
          </div>

          <div className="studio-metrics-grid">
            <OverviewCard icon={FaVideo} label="Total videos" value={formatNumber(dashboard.totalVideos)} detail={`${formatNumber(dashboard.totalShorts)} Shorts`} tone="blue" />
            <OverviewCard icon={FaEye} label="Total views" value={formatNumber(dashboard.totalViews)} detail="Across your channel" tone="red" />
            <OverviewCard icon={FaUsers} label="Subscribers" value={formatNumber(dashboard.subscribers)} detail="Your community" tone="purple" />
            <OverviewCard icon={FaHeart} label="Total likes" value={formatNumber(dashboard.totalLikes)} detail={`${formatNumber(dashboard.totalComments)} comments`} tone="green" />
          </div>
        </section>

        <section id="studio-analytics" className="studio-analytics" aria-labelledby="analytics-title">
          <div className="studio-section-heading">
            <div>
              <p className="studio-kicker">ANALYTICS</p>
              <h2 id="analytics-title">More insights are on the way</h2>
            </div>
            <FaChartLine className="studio-heading-icon" aria-hidden="true" />
          </div>
          <div className="studio-analytics-grid">
            <article><FaClock aria-hidden="true" /><span>Watch time</span><strong>Coming Soon</strong><small>Watch-time data is not available yet.</small></article>
            <article><FaRupeeSign aria-hidden="true" /><span>Revenue</span><strong>Coming Soon</strong><small>Revenue reporting will appear here.</small></article>
            <article><FaUsers aria-hidden="true" /><span>Subscriber growth</span><strong>Coming Soon</strong><small>Historical growth data is not available yet.</small></article>
          </div>
        </section>

        <section className="studio-quick-actions" aria-labelledby="quick-actions-title">
          <div className="studio-section-heading">
            <div>
              <p className="studio-kicker">QUICK ACTIONS</p>
              <h2 id="quick-actions-title">Keep your channel moving</h2>
            </div>
          </div>
          <div className="studio-action-grid">
            <button type="button" className="studio-action-card" onClick={() => navigate("/upload")}><FaVideo aria-hidden="true" /><span><strong>Upload video</strong><small>Publish your next upload</small></span><FaArrowRight aria-hidden="true" /></button>
            <button type="button" className="studio-action-card" disabled><FaEdit aria-hidden="true" /><span><strong>Edit channel</strong><small>Coming Soon</small></span><FaLock aria-hidden="true" /></button>
            <button type="button" className="studio-action-card" onClick={scrollToAnalytics}><FaChartLine aria-hidden="true" /><span><strong>Analytics</strong><small>View available insights</small></span><FaArrowRight aria-hidden="true" /></button>
            <button type="button" className="studio-action-card" disabled><FaRupeeSign aria-hidden="true" /><span><strong>Monetization</strong><small>Coming Soon</small></span><FaLock aria-hidden="true" /></button>
          </div>
        </section>

        <section className="studio-videos-section" aria-labelledby="recent-uploads-title">
          <div className="studio-section-heading">
            <div>
              <p className="studio-kicker">YOUR CONTENT</p>
              <h2 id="recent-uploads-title">Recent uploads</h2>
            </div>
            <span className="studio-section-note">Newest first</span>
          </div>

          {recentVideos.length > 0 ? (
            <div className="studio-video-list" role="list">
              {recentVideos.map((video) => (
                <article key={video._id} className="studio-video-row" role="listitem">
                  <span className="studio-video-thumbnail"><img src={video.thumbnail} alt="" /><span><FaPlay aria-hidden="true" /></span></span>
                  <div className="studio-video-title"><strong>{video.title}</strong><small>Uploaded {formatDate(video.createdAt)}</small></div>
                  <span className="studio-video-stat"><FaEye aria-hidden="true" />{formatNumber(video.views)}</span>
                  <span className={`studio-video-visibility studio-video-visibility--${video.visibility || "unknown"}`}>{formatVisibility(video.visibility)}</span>
                  <span className="studio-video-status">{video.isPublished === undefined ? "Status unavailable" : video.isPublished ? "Published" : "Draft"}</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="studio-empty-videos">
              <span><FaVideo aria-hidden="true" /></span>
              <h3>No uploads yet</h3>
              <p>Upload your first video to start building your channel.</p>
              <button type="button" onClick={() => navigate("/upload")}>Upload a video</button>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default CreatorDashboard;
