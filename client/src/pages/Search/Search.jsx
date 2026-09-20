import { useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaHistory, FaSearch } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import VideoCard from "../../components/VideoCard/VideoCard";
import searchService from "../../services/search.service";
import "./Search.css";

function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(Boolean(searchParams.get("q")));
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const nextQuery = searchParams.get("q") || "";
    setQuery(nextQuery);

    if (!nextQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    searchService.search(nextQuery)
      .then((data) => {
        if (!cancelled) setResults(Array.isArray(data.videos) ? data.videos : []);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.response?.data?.message || "Unable to search videos.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [searchParams]);

  const submitSearch = (event) => {
    event.preventDefault();
    const nextQuery = query.trim();
    if (nextQuery) navigate(`/search?q=${encodeURIComponent(nextQuery)}`);
  };

  return (
    <main className="search-page">
      <form className="search-page-header" onSubmit={submitSearch}>
        <button type="button" className="search-back-button" onClick={() => navigate(-1)} aria-label="Go back">
          <FaArrowLeft aria-hidden="true" />
        </button>
        <div className="search-page-input-wrap">
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search videos..." aria-label="Search videos" />
          <button type="submit" aria-label="Submit search"><FaSearch /></button>
        </div>
      </form>

      {!searchParams.get("q") && (
        <section className="search-empty" aria-live="polite">
          <FaHistory aria-hidden="true" />
          <h1>Search BharatTube</h1>
          <p>Your real search history will appear here when history retrieval is available.</p>
        </section>
      )}

      {loading && <p className="search-status">Searching...</p>}
      {error && <p className="search-status search-status-error" role="alert">{error}</p>}
      {!loading && !error && searchParams.get("q") && results.length === 0 && <p className="search-status">No videos found for “{searchParams.get("q")}”.</p>}
      {!loading && !error && results.length > 0 && (
        <section className="search-results" aria-label="Search results">
          {results.map((video) => (
            <VideoCard
              key={video._id}
              video={video}
              variant={video.isShort ? "short" : "default"}
              onClick={video.isShort ? () => navigate(`/shorts?video=${video._id}`) : undefined}
            />
          ))}
        </section>
      )}
    </main>
  );
}

export default Search;