import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaVideo, FaBolt, FaCamera, FaPhotoVideo,
  FaCloudUploadAlt, FaImage, FaTimes, FaCheckCircle,
  FaLock, FaGlobe, FaRupeeSign, FaTags, FaDotCircle,
} from "react-icons/fa";
import api from "../../api/axios";
import "./Upload.css";

const CATEGORIES = [
  "Music", "Gaming", "News", "Sports", "Education",
  "Comedy", "Technology", "Food", "Travel", "Fitness",
  "Fashion", "Movies", "Vlogs", "Motivation", "Other"
];

const LANGUAGES = [
  "Hindi", "English", "Tamil", "Telugu", "Bengali",
  "Marathi", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Other"
];

// =====================
// Upload Type Selector
// =====================
function TypeSelector({ onSelect }) {
  const types = [
    { id: "video", icon: <FaVideo />, label: "Video", desc: "Upload a video" },
    { id: "short", icon: <FaBolt />, label: "Short", desc: "Vertical short video" },
    { id: "live", icon: <FaDotCircle />, label: "Go Live", desc: "Start live stream" },
    { id: "photo", icon: <FaCamera />, label: "Post", desc: "Share a photo" },
  ];

  return (
    <div className="upload-page">
      <div className="upload-header">
        <h1>Create</h1>
        <p>Apna content BharatTube pe share karo 🇮🇳</p>
      </div>

      <div className="type-grid">
        {types.map((t) => (
          <div
            key={t.id}
            className="type-card"
            onClick={() => onSelect(t.id)}
          >
            <div className="type-icon">{t.icon}</div>
            <h3>{t.label}</h3>
            <p>{t.desc}</p>
          </div>
        ))}
      </div>

      <div className="upload-tips">
        <h3>💡 BharatTube Creator Benefits</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <FaBolt className="tip-icon orange" />
            <h4>1000 Views = Earning</h4>
            <p>YouTube se 3x zyada earn karo</p>
          </div>
          <div className="tip-card">
            <FaRupeeSign className="tip-icon green" />
            <h4>UPI Instant Payment</h4>
            <p>Har hafte seedha bank mein</p>
          </div>
          <div className="tip-card">
            <FaGlobe className="tip-icon blue" />
            <h4>Regional Boost</h4>
            <p>Hindi/Regional content extra reach</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================
// Video / Short Upload
// =====================
function VideoUpload({ isShort, onBack }) {
  const navigate = useNavigate();
  const videoInputRef = useRef(null);
  const thumbInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    language: "Hindi",
    tags: "",
    visibility: "public",
    monetization: true,
  });

  const selectVideo = (file) => {
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setStep(2);
  };

  const selectThumb = (file) => {
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) selectVideo(file);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError("Title required!");
    if (!form.category) return setError("Category select karo!");
    if (!isShort && !thumbFile) return setError("Thumbnail required!");

    setError("");
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      if (thumbFile) formData.append("thumbnail", thumbFile);
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("language", form.language);
      formData.append("tags", form.tags);
      formData.append("visibility", form.visibility);
      formData.append("isShort", isShort);

      const res = await api.post("/videos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      setUploadedVideo(res.data.data);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  // Step 3 — Success
  if (step === 3) {
    return (
      <div className="upload-page">
        <div className="upload-success">
          <FaCheckCircle className="success-icon" />
          <h2>{isShort ? "Short" : "Video"} Upload Ho Gaya! 🎉</h2>
          <p>Tera content process ho raha hai — thodi der mein live ho jayega</p>
          {thumbPreview && <img className="success-thumb" src={thumbPreview} alt="thumb" />}
          <h3>{form.title}</h3>
          <div className="success-btns">
            <button className="success-btn primary" onClick={() => navigate(`/watch/${uploadedVideo?._id}`)}>
              Dekho
            </button>
            <button className="success-btn secondary" onClick={onBack}>
              Aur Upload Karo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1 — Drop Zone
  if (step === 1) {
    return (
      <div className="upload-page">
        <div className="upload-header">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h1>{isShort ? "⚡ Short Upload" : "📹 Video Upload"}</h1>
          <p>{isShort ? "9:16 vertical format — Reels jaisa" : "MP4, MKV, AVI, MOV support hai"}</p>
        </div>

        <div
          className={`drop-zone ${dragOver ? "drag-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => videoInputRef.current.click()}
        >
          <input ref={videoInputRef} type="file" accept="video/*" hidden
            onChange={(e) => e.target.files[0] && selectVideo(e.target.files[0])} />
          <FaCloudUploadAlt className="drop-icon" />
          <h2>Drag & Drop karo ya Click karo</h2>
          <p>{isShort ? "Vertical video (9:16) upload karo" : "MP4, MKV, AVI, MOV support hai"}</p>
          <button className="browse-btn">Select File</button>
        </div>
      </div>
    );
  }

  // Step 2 — Details
  return (
    <div className="upload-page">
      <div className="upload-header">
        <button className="back-btn" onClick={() => setStep(1)}>← Back</button>
        <h1>{isShort ? "⚡ Short Details" : "📹 Video Details"}</h1>
      </div>

      {error && <div className="upload-error">{error}</div>}

      <div className="upload-grid">
        <div className="upload-form">

          <div className="form-group">
            <label>Title <span className="required">*</span></label>
            <input type="text" name="title" placeholder="Catchy title likho..."
              value={form.title} onChange={handleFormChange} maxLength={100} />
            <span className="char-count">{form.title.length}/100</span>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" placeholder="Video ke baare mein batao..."
              value={form.description} onChange={handleFormChange} rows={4} maxLength={2000} />
          </div>

          <div className="form-group">
            <label>Thumbnail {!isShort && <span className="required">*</span>}</label>
            <div className="thumb-upload" onClick={() => thumbInputRef.current.click()}>
              <input ref={thumbInputRef} type="file" accept="image/*" hidden
                onChange={(e) => e.target.files[0] && selectThumb(e.target.files[0])} />
              {thumbPreview ? (
                <div className="thumb-preview-wrapper">
                  <img src={thumbPreview} alt="thumbnail" className="thumb-preview" />
                  <button className="thumb-remove"
                    onClick={(e) => { e.stopPropagation(); setThumbFile(null); setThumbPreview(null); }}>
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <div className="thumb-placeholder">
                  <FaImage />
                  <span>Thumbnail Upload Karo</span>
                  <small>JPG, PNG (1280x720 recommended)</small>
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category <span className="required">*</span></label>
              <select name="category" value={form.category} onChange={handleFormChange}>
                <option value="">Select karo</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Language</label>
              <select name="language" value={form.language} onChange={handleFormChange}>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label><FaTags /> Tags</label>
            <input type="text" name="tags" placeholder="comedy, vlog, india"
              value={form.tags} onChange={handleFormChange} />
          </div>

          <div className="form-group">
            <label>Visibility</label>
            <div className="visibility-btns">
              <button className={`vis-btn ${form.visibility === "public" ? "active" : ""}`}
                onClick={() => setForm((p) => ({ ...p, visibility: "public" }))}>
                <FaGlobe /> Public
              </button>
              <button className={`vis-btn ${form.visibility === "private" ? "active" : ""}`}
                onClick={() => setForm((p) => ({ ...p, visibility: "private" }))}>
                <FaLock /> Private
              </button>
            </div>
          </div>

          <div className="toggle-row">
            <div className="toggle-item">
              <div>
                <h4>Monetization <span className="badge-new">BharatTube+</span></h4>
                <p>Views se earning enable karo</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" name="monetization" checked={form.monetization} onChange={handleFormChange} />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

        </div>

        <div className="upload-preview">
          <h3>Preview</h3>
          {videoPreview && (
            <video className={`preview-video ${isShort ? "short-preview" : ""}`}
              src={videoPreview} controls muted />
          )}
          <div className="preview-info">
            <p><strong>File:</strong> {videoFile?.name}</p>
            <p><strong>Size:</strong> {(videoFile?.size / (1024 * 1024)).toFixed(1)} MB</p>
          </div>

          {uploading && (
            <div className="progress-wrapper">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="progress-text">{progress}% uploading...</p>
            </div>
          )}

          <button className="upload-submit-btn" onClick={handleSubmit} disabled={uploading}>
            {uploading ? (
              <><span className="btn-spinner" /> Uploading... {progress}%</>
            ) : (
              <><FaCloudUploadAlt /> Upload Karo</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================
// Go Live
// =====================
function GoLive({ onBack }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState("public");

  return (
    <div className="upload-page">
      <div className="upload-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>🔴 Go Live</h1>
        <p>Apne viewers ke saath live connect karo</p>
      </div>

      <div className="live-container">
        <div className="live-setup">
          <div className="form-group">
            <label>Stream Title <span className="required">*</span></label>
            <input type="text" placeholder="Live stream ka title..."
              value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select karo</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Visibility</label>
            <div className="visibility-btns">
              <button className={`vis-btn ${visibility === "public" ? "active" : ""}`}
                onClick={() => setVisibility("public")}><FaGlobe /> Public</button>
              <button className={`vis-btn ${visibility === "private" ? "active" : ""}`}
                onClick={() => setVisibility("private")}><FaLock /> Private</button>
            </div>
          </div>

          <div className="live-info-box">
            <h4>🎥 Stream Setup</h4>
            <p>OBS ya kisi bhi streaming software se connect karo:</p>
            <div className="stream-key-box">
              <span>Stream Key:</span>
              <code>bt-live-xxxxxxxx</code>
            </div>
            <div className="stream-key-box">
              <span>RTMP URL:</span>
              <code>rtmp://live.bharattube.in/live</code>
            </div>
          </div>

          <button className="upload-submit-btn live-btn">
            <FaDotCircle /> Start Live Stream
          </button>
        </div>

        <div className="live-preview-box">
          <div className="live-placeholder">
            <FaDotCircle className="live-icon" />
            <p>Live preview yahan dikhega</p>
            <small>Stream start hone ke baad</small>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================
// Photo Post Upload
// =====================
function PhotoUpload({ onBack }) {
  const photoInputRef = useRef(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  const selectPhoto = (file) => {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!photoFile) return;
    setUploading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setUploading(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="upload-page">
        <div className="upload-success">
          <FaCheckCircle className="success-icon" />
          <h2>Post Share Ho Gaya! 🎉</h2>
          {photoPreview && <img className="success-thumb" src={photoPreview} alt="post" />}
          <p>{caption}</p>
          <button className="success-btn secondary" onClick={onBack}>Aur Post Karo</button>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-page">
      <div className="upload-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>🖼️ Photo Post</h1>
        <p>Apni community ke saath photo share karo</p>
      </div>

      <div className="photo-container">
        <div
          className="photo-drop"
          onClick={() => photoInputRef.current.click()}
        >
          <input ref={photoInputRef} type="file" accept="image/*" hidden
            onChange={(e) => e.target.files[0] && selectPhoto(e.target.files[0])} />
          {photoPreview ? (
            <img src={photoPreview} alt="preview" className="photo-preview" />
          ) : (
            <div className="photo-placeholder">
              <FaPhotoVideo />
              <span>Photo Select Karo</span>
              <small>JPG, PNG, GIF support hai</small>
            </div>
          )}
        </div>

        <div className="photo-details">
          <div className="form-group">
            <label>Caption</label>
            <textarea placeholder="Kuch likho..." value={caption}
              onChange={(e) => setCaption(e.target.value)} rows={4} maxLength={500} />
            <span className="char-count">{caption.length}/500</span>
          </div>

          <button className="upload-submit-btn" onClick={handleSubmit} disabled={!photoFile || uploading}>
            {uploading ? <><span className="btn-spinner" /> Posting...</> : <><FaCamera /> Post Karo</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================
// Main Upload Component
// =====================
function Upload() {
  const [searchParams] = useSearchParams();
  const [type, setType] = useState(() => searchParams.get("type") === "short" ? "short" : null);

  if (!type) return <TypeSelector onSelect={setType} />;
  if (type === "video") return <VideoUpload isShort={false} onBack={() => setType(null)} />;
  if (type === "short") return <VideoUpload isShort={true} onBack={() => setType(null)} />;
  if (type === "live") return <GoLive onBack={() => setType(null)} />;
  if (type === "photo") return <PhotoUpload onBack={() => setType(null)} />;
}

export default Upload;