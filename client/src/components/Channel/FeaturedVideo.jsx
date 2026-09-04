import { useNavigate } from "react-router-dom";
import "./FeaturedVideo.css";

import formatViews from "../../utils/formatViews";
import formatDuration from "../../utils/formatDuration";
import formatTimeAgo from "../../utils/formatTimeAgo";

function FeaturedVideo({ video }) {

    const navigate = useNavigate();

    if (!video) return null;

    return (

        <div
            className="featured-video"
            onClick={() => navigate(`/watch/${video._id}`)}
        >

            <div className="featured-thumbnail">

                <img
                    src={video.thumbnail}
                    alt={video.title}
                />

                <span className="featured-duration">
                    {formatDuration(video.duration)}
                </span>

            </div>

            <div className="featured-content">

                <h2>
                    {video.title}
                </h2>

                <p className="featured-meta">

                    {formatViews(video.views)}

                    {" • "}

                    {formatTimeAgo(video.createdAt)}

                </p>

                <p className="featured-description">

                    {video.description || "No description available."}

                </p>

            </div>

        </div>

    );

}

export default FeaturedVideo;