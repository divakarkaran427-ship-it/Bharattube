import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import channelService from "../../services/channel.service";
import "./EditChannel.css";

const EditChannel = () => {
  const navigate = useNavigate();

  // =========================
  // States
  // =========================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    channelName: "",
    handle: "",
    description: "",
  });

  // Images
  const [logo, setLogo] = useState(null);
  const [banner, setBanner] = useState(null);

  // Preview
  const [logoPreview, setLogoPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");

  // =========================
  // Load Channel
  // =========================

  useEffect(() => {
    fetchChannel();
  }, []);

  const fetchChannel = async () => {
    try {
      setLoading(true);

      const res = await channelService.getMyChannel();

      const channel = res.data;

      setForm({
        channelName: channel.channelName || "",
        handle: channel.handle || "",
        description: channel.description || "",
      });

      setLogoPreview(channel.logo || "");
      setBannerPreview(channel.banner || "");

    } catch (err) {

      setError(
        err?.response?.data?.message ||
        "Unable to load channel."
      );

    } finally {

      setLoading(false);

    }
  };

  // =========================
  // Input Change
  // =========================

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

  };

  // =========================
  // Logo Change
  // =========================

  const handleLogoChange = (e) => {

    const file = e.target.files[0];

    if (!file) return;

    setLogo(file);

    setLogoPreview(URL.createObjectURL(file));

  };

  // =========================
  // Banner Change
  // =========================

  const handleBannerChange = (e) => {
    
    const file = e.target.files[0];

    if (!file) return;

    setBanner(file);

    setBannerPreview(URL.createObjectURL(file));

  };
    // =========================
  // Submit
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      setSaving(true);

      // Update basic info
      await channelService.updateChannel({
        channelName: form.channelName.trim(),
        handle: form.handle.trim(),
        description: form.description.trim(),
      });

      // Upload logo & banner
      if (logo || banner) {

        const formData = new FormData();

        if (logo) {
          formData.append("logo", logo);
        }

        if (banner) {
          formData.append("banner", banner);
        }

        await channelService.updateChannelImages(formData);
      }

      setSuccess("Channel updated successfully.");

      setTimeout(() => {
        navigate(`/channel/${form.handle}`);
      }, 1200);

    } catch (err) {

      setError(
        err?.response?.data?.message ||
        "Unable to update channel."
      );

    } finally {

      setSaving(false);

    }
  };

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <div className="edit-channel-loading">
        Loading channel...
      </div>
    );
  }

  return (
    <div className="edit-channel-page">

      <div className="edit-channel-card">

        <h1>Edit Channel</h1>

        <p>
          Update your BharatTube channel details.
        </p>

        {error && (
          <div className="edit-error">
            {error}
          </div>
        )}

        {success && (
          <div className="edit-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>          {/* Channel Name */}
          <div className="form-group">
            <label>Channel Name</label>

            <input
              type="text"
              name="channelName"
              value={form.channelName}
              onChange={handleChange}
              placeholder="Enter channel name"
              required
            />
          </div>

          {/* Handle */}
          <div className="form-group">
            <label>Handle</label>

            <input
              type="text"
              name="handle"
              value={form.handle}
              onChange={handleChange}
              placeholder="bharattube_official"
              required
            />

            <small>
              https://bharattube.com/channel/{form.handle}
            </small>
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>

            <textarea
              rows="6"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Tell viewers about your channel..."
            />
          </div>

          {/* Logo Upload */}
          <div className="form-group">
            <label>Channel Logo</label>

            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
            />

            {logoPreview && (
              <img
                src={logoPreview}
                alt="Channel Logo"
                className="preview-logo"
              />
            )}
          </div>
         {/* Banner Upload */}
<div className="form-group">
  <label>Channel Banner</label>

  <input
    type="file"
    accept="image/*"
    onChange={handleBannerChange}
  />

  {bannerPreview && (
    <img
      src={bannerPreview}
      alt="Channel Banner"
      className="preview-banner"
    />
  )}
</div>
          
        

          {/* Buttons */}
          <div className="button-group">

            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-btn"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default EditChannel;