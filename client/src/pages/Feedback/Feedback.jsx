import { useState } from "react";
import { FaCommentAlt } from "react-icons/fa";
import feedbackService from "../../services/feedback.service";
import "./Feedback.css";

function Feedback() {
  const [form, setForm] = useState({ subject: "", message: "" });
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event) => { event.preventDefault(); try { setSaving(true); setStatus(""); await feedbackService.submitFeedback(form); setForm({ subject: "", message: "" }); setStatus("Thanks — your feedback was submitted."); } catch (error) { setStatus(error.response?.data?.message || "Unable to submit feedback."); } finally { setSaving(false); } };
  return <main className="feedback-page"><header><p><FaCommentAlt aria-hidden="true" /> Support</p><h1>Send feedback</h1><span>Tell us what is working well or what needs improvement.</span></header><form onSubmit={submit}><label>Subject<input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} maxLength="120" required /></label><label>Feedback<textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} rows="6" maxLength="2000" required /></label>{status && <p role="status">{status}</p>}<button type="submit" disabled={saving}>{saving ? "Sending…" : "Send feedback"}</button></form></main>;
}

export default Feedback;
