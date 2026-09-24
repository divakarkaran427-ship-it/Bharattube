import { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../../services/auth.service";
import { useAuth } from "../../context/AuthContext";
import "../../styles/auth.css";

const GOOGLE_ERROR_MESSAGES = {
  google_login_cancelled: "Google sign-in was cancelled.",
  google_email_not_verified: "Please use a Google account with a verified email address.",
  google_account_conflict: "This email is already linked to another Google account.",
  google_login_failed: "Google sign-in failed. Please try again.",
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getCurrentUser } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => GOOGLE_ERROR_MESSAGES[new URLSearchParams(location.search).get("error")] || "");

  const handleChange = (event) => {
    setFormData((previousForm) => ({ ...previousForm, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await login(formData);
      if (!response.success) throw new Error(response.message || "Login failed");

      localStorage.setItem("bharattube_token", response.data.token);
      await getCurrentUser();
      navigate("/");
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const apiBaseUrl = import.meta.env.VITE_API_URL
      || (import.meta.env.PROD ? "https://bharattube-ylmq.onrender.com/api/v1" : "http://localhost:5000/api/v1");
    window.location.assign(`${apiBaseUrl}/auth/google`);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><span className="logo-icon">▶</span><span className="logo-text">BharatTube</span></div>
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Login to continue watching.</p>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <button type="button" className="google-auth-btn" onClick={handleGoogleLogin}>
          <FaGoogle aria-hidden="true" /> Continue with Google
        </button>

        <div className="auth-divider"><span>or continue with email</span></div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group"><label htmlFor="login-email">Email</label><input id="login-email" type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required /></div>
          <div className="form-group"><label htmlFor="login-password">Password</label><input id="login-password" type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} required /></div>
          <button type="submit" className="auth-btn" disabled={loading}>{loading ? <span className="spinner" /> : "Login"}</button>
        </form>

        <p className="auth-footer">Don't have an account? <Link to="/signup">Create one with Google</Link></p>
      </div>
    </div>
  );
}

export default Login;
