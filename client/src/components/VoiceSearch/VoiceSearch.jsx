import { useEffect, useRef, useState } from "react";
import { FaMicrophone, FaStop } from "react-icons/fa";
import "./VoiceSearch.css";

export default function VoiceSearch({ onSearch }) {
  const recognitionRef = useRef(null);
  const onSearchRef = useRef(onSearch);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Voice search Chrome ya Edge mein supported hai.");
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "hi-IN";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setError("");
    };
    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript?.trim();
      if (text) onSearchRef.current?.(text);
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone permission allow karo.");
      } else if (event.error === "no-speech") {
        setError("Kuch suna nahi gaya. Dobara bolo.");
      } else if (event.error !== "aborted") {
        setError("Voice search mein problem aa gayi.");
      }
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  const toggleVoiceSearch = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setError("Voice search is browser mein supported nahi hai.");
      return;
    }

    try {
      if (listening) recognition.stop();
      else {
        setError("");
        recognition.start();
      }
    } catch {
      setListening(false);
    }
  };

  return (
    <div className="voice-search">
      <button
        type="button"
        className={`voice-search-btn ${listening ? "listening" : ""}`}
        onClick={toggleVoiceSearch}
        aria-label={listening ? "Stop voice search" : "Search with voice"}
        title={listening ? "Stop" : "Search with voice"}
      >
        {listening ? <FaStop /> : <FaMicrophone />}
      </button>
      {listening && <div className="voice-status">🎤 Sun raha hoon... bolo</div>}
      {error && <div className="voice-error" role="alert">{error}</div>}
    </div>
  );
}
