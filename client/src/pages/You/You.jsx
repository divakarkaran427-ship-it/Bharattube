import { useNavigate } from "react-router-dom";
import { FaCog, FaHistory, FaList, FaSignOutAlt, FaThumbsUp, FaUserCircle } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import "./You.css";

function You() {
  const navigate = useNavigate();
  const { user, channel, hasChannel, logout } = useAuth();
  const initial = user?.name?.trim().charAt(0).toUpperCase() || "U";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <main className="you-page">
      <section className="you-profile" aria-labelledby="you-title">
        <span className="you-avatar">
          {user?.profilePhoto ? <img src={user.profilePhoto} alt="" /> : user ? initial : <FaUserCircle aria-hidden="true" />}
        </span>
        <div>
          <h1 id="you-title">{user?.name || "Your account"}</h1>
          <p>{user?.username || user?.email || "Sign in to access your account"}</p>
        </div>
      </section>

      <div className="you-actions">
        {hasChannel && channel?.handle ? (
          <button type="button" onClick={() => navigate(`/channel/${channel.handle}`)}><FaUserCircle /> View channel</button>
        ) : (
          <button type="button" onClick={() => navigate("/create-channel")}><FaUserCircle /> Create channel</button>
        )}
        <button type="button" onClick={() => navigate("/history")}><FaHistory /> History</button>
        <button type="button" onClick={() => navigate("/playlists")}><FaList /> Playlists</button>
        <button type="button" onClick={() => navigate("/liked-videos")}><FaThumbsUp /> Liked videos</button>
        <button type="button" onClick={() => navigate("/settings")}><FaCog /> Settings</button>
        {user && <button type="button" className="you-logout" onClick={handleLogout}><FaSignOutAlt /> Logout</button>}
      </div>
    </main>
  );
}

export default You;