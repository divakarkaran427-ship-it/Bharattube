import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import { useSidebar } from "../../context/SidebarContext";
import "./Layout.css";

function Layout({ children }) {
  const { collapsed, toggleSidebar } = useSidebar();

  return (
    <>
      <Navbar />
      <div className="layout">

        {/* Overlay — bahar click karne pe band ho */}
        {!collapsed && (
          <div
            className="sidebar-overlay show"
            onClick={toggleSidebar}
          />
        )}

        <Sidebar />

        {/* Content hamesha same rahega */}
        <main className="main-content">
          {children}
        </main>


      </div>
    </>
  );
}

export default Layout;
