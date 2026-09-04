import { useEffect, useState } from "react";
import { FaCheck, FaClipboardCheck, FaTimes } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import copyrightMatchService from "../../services/copyrightMatch.service";
import "./AdminCopyrightMatches.css";

function AdminCopyrightMatches() {
  const { user, loading: authLoading } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (authLoading || user?.role !== "admin") return;

    const loadMatches = async () => {
      try {
        const response = await copyrightMatchService.getPendingMatches();
        setMatches(Array.isArray(response.data) ? response.data : []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load copyright matches.");
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [authLoading, user]);

  const reviewMatch = async (matchResultId, decision) => {
    try {
      setActionId(matchResultId);
      setError("");
      setNotice("");
      const response = await copyrightMatchService.reviewMatch(matchResultId, decision);
      setMatches((current) => current.map((match) => (
        match._id === matchResultId ? { ...match, ...response.data } : match
      )));
      setNotice(`Match reviewed as ${decision}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to review this match.");
    } finally {
      setActionId("");
    }
  };

  const createClaim = async (matchResultId) => {
    try {
      setActionId(matchResultId);
      setError("");
      setNotice("");
      await copyrightMatchService.createClaim(matchResultId);
      setMatches((current) => current.filter((match) => match._id !== matchResultId));
      setNotice("Automated pending claim created.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create the automated claim.");
    } finally {
      setActionId("");
    }
  };

  if (authLoading || loading && user?.role === "admin") {
    return <main className="admin-matches-page"><p role="status">Loading copyright matches...</p></main>;
  }

  if (!user || user.role !== "admin") {
    return <main className="admin-matches-page"><section className="admin-matches-state"><h1>Access denied</h1><p>Only administrators can review copyright matches.</p></section></main>;
  }

  return (
    <main className="admin-matches-page">
      <header className="admin-matches-header">
        <p><FaClipboardCheck aria-hidden="true" /> Copyright review</p>
        <h1>Fingerprint matches</h1>
        <span>Review potential matches before any claim is created.</span>
      </header>

      {error && <p className="admin-matches-message admin-matches-message--error" role="alert">{error}</p>}
      {notice && <p className="admin-matches-message" role="status">{notice}</p>}
      {!matches.length ? <section className="admin-matches-state"><h2>No pending matches</h2><p>New potential matches will appear here.</p></section> : (
        <section className="admin-match-list" aria-label="Pending copyright matches">
          {matches.map((match) => {
            const busy = actionId === match._id;
            const reviewedValid = match.status === "reviewed_valid";
            return (
              <article className="admin-match-card" key={match._id}>
                <div className="admin-match-details">
                  <span className="admin-match-status">{match.status}</span>
                  <h2>Match {match._id}</h2>
                  <dl>
                    <div><dt>Source video</dt><dd>{String(match.sourceVideo || "Not provided")}</dd></div>
                    <div><dt>Reference</dt><dd>{String(match.reference || "Not provided")}</dd></div>
                    <div><dt>Match type</dt><dd>{match.matchType || "Not provided"}</dd></div>
                    <div><dt>Score</dt><dd>{Number.isFinite(match.score) ? match.score : "Not provided"}</dd></div>
                  </dl>
                </div>
                <div className="admin-match-actions">
                  {match.status === "pending_review" || match.status === "potential_match" ? (
                    <>
                      <button type="button" onClick={() => reviewMatch(match._id, "valid")} disabled={busy}><FaCheck aria-hidden="true" /> Review as Valid</button>
                      <button type="button" className="admin-match-reject" onClick={() => reviewMatch(match._id, "rejected")} disabled={busy}><FaTimes aria-hidden="true" /> Review as Rejected</button>
                    </>
                  ) : null}
                  {reviewedValid && <button type="button" onClick={() => createClaim(match._id)} disabled={busy}><FaClipboardCheck aria-hidden="true" /> Create automated claim</button>}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

export default AdminCopyrightMatches;