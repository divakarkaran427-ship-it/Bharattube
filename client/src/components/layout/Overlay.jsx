import "./Overlay.css";
import { useSidebar } from "../../context/SidebarContext";

function Overlay() {
  const { sidebarOpen, closeSidebar } = useSidebar();

  if (!sidebarOpen) return null;

  return (
    <div
      className="overlay"
      onClick={closeSidebar}
    />
  );
}

export default Overlay;