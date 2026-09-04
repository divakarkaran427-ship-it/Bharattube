import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaBolt,
  FaBroadcastTower,
  FaCheckCircle,
  FaCloudUploadAlt,
  FaPlus,
  FaRegCommentDots,
  FaVideo,
} from "react-icons/fa";
import "./Create.css";

const createOptions = [
  {
    id: "upload",
    title: "Upload Video",
    description: "Share a full video with your audience.",
    icon: FaCloudUploadAlt,
    accent: "create-card--upload",
    action: "upload",
  },
  {
    id: "short",
    title: "Create Short",
    description: "Capture a quick moment that stands out.",
    icon: FaBolt,
    accent: "create-card--short",
    action: "short",
  },
  {
    id: "live",
    title: "Go Live",
    description: "Connect with viewers in real time.",
    icon: FaBroadcastTower,
    accent: "create-card--live",
    action: "soon",
  },
  {
    id: "post",
    title: "Create Post",
    description: "Start a conversation with your community.",
    icon: FaRegCommentDots,
    accent: "create-card--post",
    action: "soon",
  },
];

function Create() {
  const navigate = useNavigate();
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (!toastVisible) return undefined;

    const timeoutId = window.setTimeout(() => setToastVisible(false), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [toastVisible]);

  const handleOptionClick = (action) => {
    if (action === "upload") {
      navigate("/upload");
      return;
    }

    if (action === "short") {
      navigate("/upload?type=short");
      return;
    }

    setToastVisible(false);
    window.requestAnimationFrame(() => setToastVisible(true));
  };

  return (
    <main className="create-page">
      <section className="create-screen" aria-labelledby="create-title">
        <header className="create-header">
          <button
            type="button"
            className="create-back-button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <FaArrowLeft aria-hidden="true" />
          </button>

          <div>
            <p className="create-eyebrow">BHARATTUBE STUDIO</p>
            <h1 id="create-title">Create</h1>
          </div>
        </header>

        <div className="create-intro">
          <span className="create-intro-icon" aria-hidden="true">
            <FaPlus />
          </span>
          <div>
            <h2>Make something worth watching</h2>
            <p>Choose how you want to share with BharatTube.</p>
          </div>
        </div>

        <div className="create-options" role="list">
          {createOptions.map(({ id, title, description, icon: Icon, accent, action }) => (
            <button
              key={id}
              type="button"
              className={`create-card ${accent}`}
              onClick={() => handleOptionClick(action)}
              role="listitem"
            >
              <span className="create-card-icon" aria-hidden="true">
                <Icon />
              </span>
              <span className="create-card-content">
                <span className="create-card-title">{title}</span>
                <span className="create-card-description">{description}</span>
              </span>
              <FaVideo className="create-card-arrow" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <div
        className={`create-toast ${toastVisible ? "create-toast--visible" : ""}`}
        role="status"
        aria-live="polite"
        aria-hidden={!toastVisible}
      >
        <FaCheckCircle aria-hidden="true" />
        <span>Coming Soon</span>
      </div>
    </main>
  );
}

export default Create;
