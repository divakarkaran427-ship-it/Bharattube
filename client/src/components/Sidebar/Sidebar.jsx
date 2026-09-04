import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHome, FaFire, FaHistory,
  FaPlayCircle, FaWallet, FaCog,
  FaBolt, // ⭐ Shorts icon
} from "react-icons/fa";
import { useSidebar } from "../../context/SidebarContext";
import "./Sidebar.css";

const menus = [
  { icon: <FaHome />, title: "Home", path: "/" },
  { icon: <FaBolt />, title: "Shorts", path: "/shorts" }, // ⭐ Add karo
  { icon: <FaFire />, title: "Trending", path: "/trending" },
  { icon: <FaPlayCircle />, title: "Subscriptions", path: "/subscriptions" },
  { icon: <FaHistory />, title: "History", path: "/history" },
  { icon: <FaWallet />, title: "Wallet", path: "/wallet" },
  { icon: <FaCog />, title: "Settings", path: "/settings" },
];

function Sidebar() {
  const { collapsed } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {menus.map((item, index) => (
        <div
          key={index}
          className={`menu ${location.pathname === item.path ? "active" : ""}`}
          onClick={() => navigate(item.path)}
          title={collapsed ? item.title : ""}
        >
          <span className="menu-icon">{item.icon}</span>
          {!collapsed && <span className="menu-title">{item.title}</span>}
        </div>
      ))}
    </aside>
  );
}

export default Sidebar;