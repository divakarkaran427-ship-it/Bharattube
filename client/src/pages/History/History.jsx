import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { FaHistory, FaSearch, FaTimes, FaTrashAlt } from "react-icons/fa";
import HistoryVideoCard from "../../components/History/HistoryVideoCard";
import watchHistoryService from "../../services/watchHistory.service";
import "./History.css";

function History() {
  const [history, setHistory] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingVideoId, setRemovingVideoId] = useState("");
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const loadHistory = useCallback(async () => {
    const [historyData, continueData] = await Promise.all([
      watchHistoryService.getHistory({ limit: 30, search: deferredSearch }),
      watchHistoryService.getContinueWatching(12),
    ]);

    return {
      history: historyData.history || [],
      continueWatching: continueData,
    };
  }, [deferredSearch]);

  useEffect(() => {
    let isCurrent = true;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await loadHistory();

        if (!isCurrent) return;

        setHistory(data.history);
        setContinueWatching(data.continueWatching);
      } catch (requestError) {
        if (isCurrent) {
          setError(requestError.response?.data?.message || "Unable to load your watch history.");
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchHistory();

    return () => {
      isCurrent = false;
    };
  }, [loadHistory]);

  const removeHistoryItem = async (videoId) => {
    try {
      setRemovingVideoId(videoId);
      setError("");
      await watchHistoryService.removeHistoryItem(videoId);
      setHistory((items) => items.filter((item) => item.video?._id !== videoId));
      setContinueWatching((items) => items.filter((item) => item.video?._id !== videoId));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to remove this video from history.");
    } finally {
      setRemovingVideoId("");
    }
  };

  const clearHistory = async () => {
    try {
      setClearing(true);
      setError("");
      await watchHistoryService.clearHistory();
      setHistory([]);
      setContinueWatching([]);
      setShowClearConfirm(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to clear your watch history.");
    } finally {
      setClearing(false);
    }
  };

  return (
    <main className="history-page">
      <header className="history-page-header">
        <div>
          <p className="history-page-eyebrow"><FaHistory aria-hidden="true" /> Library</p>
          <h1>Watch history</h1>
          <p>Pick up where you left off or manage the videos you watched.</p>
        </div>
        <button
          type="button"
          className="history-clear-button"
          onClick={() => setShowClearConfirm(true)}
          disabled={loading || history.length === 0}
        >
          <FaTrashAlt aria-hidden="true" /> Clear all
        </button>
      </header>

      <label className="history-search" htmlFor="watch-history-search">
        <FaSearch aria-hidden="true" />
        <input
          id="watch-history-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search watch history"
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} aria-label="Clear history search">
            <FaTimes aria-hidden="true" />
          </button>
        )}
      </label>

      {error && <p className="history-message history-message--error" role="alert">{error}</p>}

      {showClearConfirm && (
        <section className="history-confirmation" role="alertdialog" aria-modal="true" aria-labelledby="clear-history-title">
          <div>
            <h2 id="clear-history-title">Clear watch history?</h2>
            <p>This removes all watched videos and saved progress from your account.</p>
          </div>
          <div className="history-confirmation-actions">
            <button type="button" onClick={() => setShowClearConfirm(false)} disabled={clearing}>Cancel</button>
            <button type="button" onClick={clearHistory} disabled={clearing}>{clearing ? "Clearing…" : "Clear history"}</button>
          </div>
        </section>
      )}

      {loading ? (
        <section className="history-state" aria-live="polite">Loading your watch history…</section>
      ) : (
        <>
          {!search && continueWatching.length > 0 && (
            <section className="history-section" aria-labelledby="continue-watching-title">
              <div className="history-section-header">
                <div>
                  <h2 id="continue-watching-title">Continue watching</h2>
                  <p>Resume videos that you have not finished yet.</p>
                </div>
              </div>
              <div className="history-continue-grid">
                {continueWatching.map((item) => (
                  <HistoryVideoCard
                    key={item._id}
                    historyItem={item}
                    variant="continue"
                    onRemove={removeHistoryItem}
                    removing={removingVideoId === item.video?._id}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="history-section" aria-labelledby="recently-watched-title">
            <div className="history-section-header">
              <div>
                <h2 id="recently-watched-title">{search ? "Search results" : "Recently watched"}</h2>
                <p>{search ? `Videos matching “${search}”` : "Videos watched from your BharatTube account."}</p>
              </div>
            </div>

            {history.length > 0 ? (
              <div className="history-list">
                {history.map((item) => (
                  <HistoryVideoCard
                    key={item._id}
                    historyItem={item}
                    onRemove={removeHistoryItem}
                    removing={removingVideoId === item.video?._id}
                  />
                ))}
              </div>
            ) : (
              <div className="history-state history-state--empty">
                <FaHistory aria-hidden="true" />
                <h2>{search ? "No matching videos" : "No watch history yet"}</h2>
                <p>{search ? "Try a different title or keyword." : "Videos you watch will appear here automatically."}</p>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default History;
