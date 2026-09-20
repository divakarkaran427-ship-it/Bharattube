import { FaPlayCircle } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import "./Subscriptions.css";

function Subscriptions() {
  const { user } = useAuth();

  return (
    <main className="subscriptions-page">
      <div className="subscriptions-icon"><FaPlayCircle aria-hidden="true" /></div>
      <h1>Subscriptions</h1>
      <p>
        {user
          ? "Your subscribed channels and latest videos will appear here when the subscriptions feed is available."
          : "Sign in to keep track of the channels you subscribe to."}
      </p>
    </main>
  );
}

export default Subscriptions;