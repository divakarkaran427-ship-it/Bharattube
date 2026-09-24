import { FaGoogle } from "react-icons/fa";
import { Link } from "react-router-dom";
import "../../styles/auth.css";

function Signup() {
  const handleGoogleSignup = () => {
    const apiBaseUrl = import.meta.env.VITE_API_URL
      || (import.meta.env.PROD ? "https://bharattube-ylmq.onrender.com/api/v1" : "http://localhost:5000/api/v1");
    window.location.assign(`${apiBaseUrl}/auth/google`);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><span className="logo-icon">▶</span><span className="logo-text">BharatTube</span></div>
        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">BharatTube accounts are created securely with your Google account.</p>
        <button type="button" className="google-auth-btn google-auth-btn--signup" onClick={handleGoogleSignup}>
          <FaGoogle aria-hidden="true" /> Sign up with Google
        </button>
        <p className="auth-google-note">Your verified Google name, email and profile photo will be used to create your BharatTube account.</p>
        <p className="auth-footer">Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}

export default Signup;
