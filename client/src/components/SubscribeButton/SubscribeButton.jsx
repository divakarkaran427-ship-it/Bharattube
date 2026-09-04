import { useState } from "react";
import { FaBell, FaCheck } from "react-icons/fa";
import { toggleSubscription } from "../../services/subscription.service";
import "./SubscribeButton.css";

function SubscribeButton({
  channelId,
  initialSubscribed = false,
  initialSubscribers = 0,
  onSubscriptionChange,
}) {
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (loading) return;

    const previousState = isSubscribed;
    const previousCount = subscribers;

    // Optimistic UI
    setLoading(true);

    setIsSubscribed(!previousState);

    setSubscribers(
      previousState
        ? previousCount - 1
        : previousCount + 1
    );

    try {
      const res = await toggleSubscription(channelId);

      setSubscribers(res.subscribers);

      if (typeof onSubscriptionChange === "function") {
        onSubscriptionChange({
          subscribed: !previousState,
          subscribers: res.subscribers,
        });
      }
    } catch (error) {
      // Rollback
      setIsSubscribed(previousState);
      setSubscribers(previousCount);

      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscribe-wrapper">

      <button
        className={`subscribe-btn ${
          isSubscribed ? "subscribed" : ""
        }`}
        onClick={handleSubscribe}
        disabled={loading}
      >

        {loading ? (
          <span className="loader"></span>
        ) : isSubscribed ? (
          <>
            <FaCheck />
            <span>Subscribed</span>
            <FaBell className="bell" />
          </>
        ) : (
          <span>Subscribe</span>
        )}

      </button>

      <p className="subscriber-count">
        {subscribers.toLocaleString()} subscribers
      </p>

    </div>
  );
}

export default SubscribeButton;