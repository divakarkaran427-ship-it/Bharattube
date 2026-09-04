import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/auth.css";

function GoogleAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getCurrentUser } = useAuth();
  const [message, setMessage] = useState("Signing you in with Google…");

  useEffect(() => {
    const completeSignIn = async () => {
      const token = searchParams.get("token");
      const error = searchParams.get("error");

      if (error || !token) {
        navigate(`/login?error=${encodeURIComponent(error || "google_login_failed")}`, { replace: true });
        return;
      }

      try {
        localStorage.setItem("bharattube_token", token);
        await getCurrentUser();
        navigate("/", { replace: true });
      } catch (requestError) {
        localStorage.removeItem("bharattube_token");
        setMessage("Google sign-in could not be completed. Redirecting to login…");
        window.setTimeout(() => navigate("/login?error=google_login_failed", { replace: true }), 1200);
      }
    };

    completeSignIn();
  }, [getCurrentUser, navigate, searchParams]);

  return (
    <main className="auth-page">
      <section className="auth-card auth-callback-card" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <h1 className="auth-title">Google sign-in</h1>
        <p className="auth-subtitle">{message}</p>
      </section>
    </main>
  );
}

export default GoogleAuthCallback;
