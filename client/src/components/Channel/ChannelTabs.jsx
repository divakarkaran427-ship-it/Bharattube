import { useRef } from "react";
import "./ChannelTabs.css";

const TABS = [
  { id: "home", label: "Home" },
  { id: "videos", label: "Videos" },
  { id: "shorts", label: "Shorts" },
  { id: "playlists", label: "Playlists" },
  { id: "about", label: "About" },
];

function ChannelTabs({ activeTab = "videos", onTabChange = () => {} }) {
  const tabRefs = useRef([]);

  const selectTab = (tabId) => {
    onTabChange(tabId);
  };

  const handleKeyDown = (event, index) => {
    let nextIndex = index;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = TABS.length - 1;
    else return;

    event.preventDefault();
    tabRefs.current[nextIndex]?.focus();
    selectTab(TABS[nextIndex].id);
  };

  return (
    <div className="channel-tabs" role="tablist" aria-label="Channel content">
      {TABS.map((tab, index) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            ref={(element) => { tabRefs.current[index] = element; }}
            type="button"
            id={`channel-tab-${tab.id}`}
            className={`tab-btn ${isActive ? "active" : ""}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`channel-panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => selectTab(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default ChannelTabs;
