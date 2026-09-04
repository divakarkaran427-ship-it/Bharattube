import { useEffect, useState } from "react";
import { FaBalanceScale, FaCheckCircle, FaPaperPlane } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import copyrightClaimService from "../../services/copyrightClaim.service";
import "./CopyrightClaims.css";

const eligibleStatuses = ["pending", "under_review", "valid"];

const displayValue = (value) => {
  if (!value) return "Not provided";
  if (typeof value === "object") return value._id || value.name || "Not provided";
  return String(value);
};

function CopyrightClaims() {
  const { user, loading: authLoading } = useAuth();
  const [claims, setClaims] = useState([]);
  const [disputes, setDisputes] = useState({});
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;

    let isCurrent = true;
    const loadClaims = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await copyrightClaimService.getCreatorClaims();
        if (isCurrent) setClaims(Array.isArray(response.data) ? response.data : []);
      } catch (requestError) {
        if (isCurrent) setError(requestError.response?.data?.message || "Unable to load your copyright claims.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadClaims();
    return () => { isCurrent = false; };
  }, [authLoading, user]);

  const updateForm = (claimId, field, value) => {
    setForms((current) => ({
      ...current,
      [claimId]: { ...current[claimId], [field]: value },
    }));
  };

  const submitDispute = async (event, claimId) => {
    event.preventDefault();
    const form = forms[claimId] || {};
    if (!form.reason?.trim()) return;

    try {
      setDisputes((current) => ({ ...current, [claimId]: { submitting: true } }));
      setError("");
      const response = await copyrightClaimService.submitDispute(claimId, {
        reason: form.reason.trim(),
        evidence: form.evidence?.trim() || "",
      });
      setDisputes((current) => ({ ...current, [claimId]: { submitted: response.data } }));
    } catch (requestError) {
      setDisputes((current) => ({
        ...current,
        [claimId]: { error: requestError.response?.data?.message || "Unable to submit this dispute." },
      }));
    }
  };

  if (authLoading || loading && user) {
    return <main className="copyright-claims-page"><section className="copyright-claims-state" role="status">Loading your copyright claims...</section></main>;
  }

  if (!user) {
    return <main className="copyright-claims-page"><section className="copyright-claims-state"><h1>Sign in required</h1><p>Sign in to view claims on your videos.</p></section></main>;
  }

  return (
    <main className="copyright-claims-page">
      <header className="copyright-claims-header">
        <p><FaBalanceScale aria-hidden="true" /> Creator support</p>
        <h1>Copyright claims</h1>
        <span>Review claims attached to your uploaded videos and submit a dispute when needed.</span>
      </header>

      {error && <p className="copyright-claims-message copyright-claims-message--error" role="alert">{error}</p>}

      {!claims.length ? (
        <section className="copyright-claims-state">
          <h2>No copyright claims</h2>
          <p>Claims on your uploaded videos will appear here.</p>
        </section>
      ) : (
        <section className="copyright-claim-list" aria-label="Copyright claims">
          {claims.map((claim) => {
            const claimDispute = disputes[claim._id];
            const form = forms[claim._id] || {};
            const canDispute = eligibleStatuses.includes(claim.status) && !claimDispute?.submitted && !claimDispute?.submitting;

            return (
              <article className="copyright-claim-card" key={claim._id}>
                <div className="copyright-claim-card-header">
                  <div>
                    <span className="copyright-claim-eyebrow">Claim {displayValue(claim._id)}</span>
                    <h2>{displayValue(claim.video)}</h2>
                  </div>
                  <span className={`copyright-claim-status copyright-claim-status--${claim.status}`}>{displayValue(claim.status)}</span>
                </div>

                <dl className="copyright-claim-details">
                  <div><dt>Claimant</dt><dd>{displayValue(claim.claimantUser)}</dd></div>
                  <div><dt>Claimant channel</dt><dd>{displayValue(claim.claimantChannel)}</dd></div>
                  <div><dt>Claim type</dt><dd>{displayValue(claim.claimType)}</dd></div>
                  <div><dt>Submitted</dt><dd>{claim.submittedAt ? new Date(claim.submittedAt).toLocaleString() : "Not provided"}</dd></div>
                </dl>

                <div className="copyright-claim-copy">
                  <div><strong>Reason</strong><p>{displayValue(claim.reason)}</p></div>
                  <div><strong>Evidence</strong><p>{displayValue(claim.evidence)}</p></div>
                </div>

                {claimDispute?.submitted ? (
                  <div className="copyright-dispute-success" role="status">
                    <FaCheckCircle aria-hidden="true" />
                    <span>Dispute submitted. Status: <strong>{displayValue(claimDispute.submitted.status)}</strong></span>
                  </div>
                ) : canDispute ? (
                  <form className="copyright-dispute-form" onSubmit={(event) => submitDispute(event, claim._id)}>
                    <h3>Submit a dispute</h3>
                    <label>Reason<textarea value={form.reason || ""} onChange={(event) => updateForm(claim._id, "reason", event.target.value)} rows="3" required /></label>
                    <label>Evidence<textarea value={form.evidence || ""} onChange={(event) => updateForm(claim._id, "evidence", event.target.value)} rows="3" /></label>
                    {claimDispute?.error && <p className="copyright-dispute-error" role="alert">{claimDispute.error}</p>}
                    <button type="submit"><FaPaperPlane aria-hidden="true" /> Submit dispute</button>
                  </form>
                ) : claimDispute?.submitting ? (
                  <p className="copyright-dispute-pending" role="status">Submitting dispute...</p>
                ) : (
                  <p className="copyright-dispute-unavailable">This claim is not currently eligible for a dispute.</p>
                )}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

export default CopyrightClaims;