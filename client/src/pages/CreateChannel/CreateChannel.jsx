import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import channelService from "../../services/channel.service";

const inputBaseStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #2d3748",
  background: "#0f172a",
  color: "#f8fafc",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#cbd5e1",
  fontSize: "13px",
  fontWeight: 600,
};

const errorTextStyle = {
  color: "#fca5a5",
  marginTop: "6px",
  fontSize: "12px",
};

const fieldStyle = {
  marginBottom: "16px",
};

const CreateChannel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [form, setForm] = useState({
    name: "",
    handle: "",
    description: "",
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const previewImage = useMemo(() => {
    if (!profilePhoto) return "";
    return URL.createObjectURL(profilePhoto);
  }, [profilePhoto]);

  const previewBanner = useMemo(() => {
    if (!banner) return "";
    return URL.createObjectURL(banner);
  }, [banner]);

  useEffect(() => {
    return () => {
      if (previewImage) URL.revokeObjectURL(previewImage);
      if (previewBanner) URL.revokeObjectURL(previewBanner);
    };
  }, [previewImage, previewBanner]);

  const validate = () => {
    if (!form.name.trim()) {
      return "Channel name is required.";
    }

    if (form.name.trim().length < 3) {
      return "Channel name must be at least 3 characters.";
    }

    if (!form.handle.trim()) {
      return "Channel handle is required.";
    }

    const cleanedHandle = form.handle.trim().replace(/^@+/, "");
    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(cleanedHandle)) {
      return "Handle must be 3-30 characters and contain only letters, numbers, dots, underscores, or hyphens.";
    }

    if (!form.description.trim()) {
      return "Description is required.";
    }

    if (form.description.trim().length < 10) {
      return "Description must be at least 10 characters.";
    }

    // if (!profilePhoto) {
    //   return "Profile photo is required.";
    // }

    // if (!banner) {
    //   return "Banner is required.";
    // }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const payload = {
      channelName: form.name.trim(),
      handle: form.handle.trim().replace(/^@+/, ""),
      description: form.description.trim(),
    };

      const response = await channelService.createChannel(payload);
      if (response?.success === false) {
        throw new Error(response?.message || "Unable to create channel.");
      }

      setSuccessMessage("Channel created successfully.");
      setForm({ name: "", handle: "", description: "" });
      setProfilePhoto(null);
      setBanner(null);

      const cleanedHandle = form.handle.trim().replace(/^@+/, "");
      setTimeout(() => {
        navigate(`/channel/${cleanedHandle}`);
      }, 700);
    } catch (submitError) {
      setError(submitError?.response?.data?.message || submitError?.message || "Unable to create channel right now.");
    } finally {
      setLoading(false);
    }
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#f8fafc",
        padding: isMobile ? "16px" : "24px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "860px",
          background: "#111827",
          border: "1px solid #1f2937",
          borderRadius: "20px",
          padding: isMobile ? "16px" : "24px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? "22px" : "28px" }}>Create channel</h1>
          <p style={{ margin: "8px 0 0", color: "#94a3b8", fontSize: "14px" }}>
            Build your brand and publish content from your channel.
          </p>
        </div>

        {error ? <div style={{ ...errorTextStyle, marginBottom: "14px" }}>{error}</div> : null}
        {successMessage ? (
          <div
            style={{
              color: "#86efac",
              marginBottom: "14px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {successMessage}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
            gap: isMobile ? "16px" : "20px",
          }}
        >
          <div style={fieldStyle}>
            <label htmlFor="name" style={labelStyle}>
              Channel name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Enter channel name"
              style={inputBaseStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="handle" style={labelStyle}>
              @handle
            </label>
            <input
              id="handle"
              type="text"
              name="handle"
              value={form.handle}
              onChange={onChange}
              placeholder="Enter channel handle"
              style={inputBaseStyle}
            />
          </div>

          <div style={{ ...fieldStyle, gridColumn: isMobile ? "auto" : "1 / -1" }}>
            <label htmlFor="description" style={labelStyle}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={onChange}
              placeholder="Describe your channel"
              rows={5}
              style={{
                ...inputBaseStyle,
                resize: "vertical",
                minHeight: "120px",
              }}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Profile photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setProfilePhoto(event.target.files?.[0] || null)}
              style={{ ...inputBaseStyle, padding: "10px" }}
            />
            {previewImage ? (
              <div style={{ marginTop: "10px" }}>
                <img
                  src={previewImage}
                  alt="Profile preview"
                  style={{ width: "92px", height: "92px", borderRadius: "50%", objectFit: "cover", border: "1px solid #334155" }}
                />
              </div>
            ) : null}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Banner</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setBanner(event.target.files?.[0] || null)}
              style={{ ...inputBaseStyle, padding: "10px" }}
            />
            {previewBanner ? (
              <div style={{ marginTop: "10px" }}>
                <img
                  src={previewBanner}
                  alt="Banner preview"
                  style={{ width: "100%", maxWidth: "360px", height: "120px", objectFit: "cover", borderRadius: "14px", border: "1px solid #334155" }}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              border: "none",
              background: loading ? "#4b5563" : "#ef4444",
              color: "#fff",
              fontWeight: 700,
              fontSize: "14px",
              padding: "12px 18px",
              borderRadius: "12px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating channel..." : "Create channel"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateChannel;
