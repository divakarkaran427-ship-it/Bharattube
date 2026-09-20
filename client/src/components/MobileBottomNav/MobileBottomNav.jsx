import { useLocation, useNavigate } from "react-router-dom";
import { FaBolt, FaHome, FaPlus, FaPlayCircle, FaUserCircle } from "react-icons/fa";
import "./MobileBottomNav.css";

const items = [
  { label: "Home", path: "/", icon: FaHome },
  { label: "Shorts", path: "/shorts", icon: FaBolt },
  { label: "Create", path: "/create", icon: FaPlus, prominent: true },
  { label: "Subscriptions", path: "/subscriptions", icon: FaPlayCircle },
  { label: "You", path: "/you", icon: FaUserCircle },
];

function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === "/search") return null;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {items.map(({ label, path, icon: Icon, prominent }) => {
        const active = location.pathname === path || (path === "/" && location.pathname === "/");

        return (
          <button
            key={path}
            type="button"
            className={`mobile-bottom-nav-item${active ? " active" : ""}${prominent ? " prominent" : ""}`}
            onClick={() => navigate(path)}
            aria-current={active ? "page" : undefined}
          >
            <span className="mobile-bottom-nav-icon"><Icon aria-hidden="true" /></span>
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default MobileBottomNav;