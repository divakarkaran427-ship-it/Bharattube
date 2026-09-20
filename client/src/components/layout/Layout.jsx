import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import MobileBottomNav from "../MobileBottomNav/MobileBottomNav";
import { useSidebar } from "../../context/SidebarContext";
import "./Layout.css";
import { useLocation } from "react-router-dom";

function Layout({ children }) {
  const { collapsed, toggleSidebar } = useSidebar();
  const location = useLocation();

  // Admin pages ke liye normal BharatTube Layout hide rahega
  const isAdminPage = location.pathname.startsWith("/admin");

  // Admin Dashboard ko apna separate layout use karne do
  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />

      <div className="layout">

        {/* Overlay — bahar click karne pe sidebar band ho */}
        {!collapsed && (
          <div
            className="sidebar-overlay show"
            onClick={toggleSidebar}
          />
        )}

        <Sidebar />

        {/* Main content */}
        <main className="main-content">
          {children}
        </main>

        <MobileBottomNav />

      </div>
    </>
  );
}

export default Layout;