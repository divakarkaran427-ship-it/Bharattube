import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import shortsService from "../../services/shorts.service";
import formatViews from "../../utils/formatViews";
import "./ShortsShelf.css";

function ShortsShelf() {
  const navigate = useNavigate();
  const [shorts, setShorts] = useState([]);

  useEffect(() => {
    let cancelled = false;

    shortsService.getFeed({ page: 1, limit: 6 })
      .then((data) => {
        if (!cancelled) setShorts(Array.isArray(data.shorts) ? data.shorts : []);
      })
      .catch(() => {
        if (!cancelled) setShorts([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!shorts.length) return null;

  return (
    <section className="shorts-shelf" aria-labelledby="shorts-shelf-title">
      <div className="shorts-shelf-header">
        <h2 id="shorts-shelf-title">Shorts</h2>
        <button type="button" onClick={() => navigate("/shorts")}>View all</button>
      </div>
      <div className="shorts-shelf-grid">
        {shorts.map((short) => (
          <button
            type="button"
            className="shorts-shelf-card"
            key={short._id}
            onClick={() => navigate(`/shorts?video=${short._id}`)}
          >
            <span className="shorts-shelf-thumbnail">
              <img src={short.thumbnail} alt={short.title} loading="lazy" />
            </span>
            <strong>{short.title}</strong>
            <span>{formatViews(short.views)} views</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default ShortsShelf;
