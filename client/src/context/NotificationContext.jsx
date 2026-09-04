import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import notificationService from "../services/notification.service";

const NotificationContext = createContext();

function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return 0;
    }

    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
      return count;
    } catch {
      return 0;
    }
  }, [user]);

  useEffect(() => {
    refreshUnreadCount();

    if (!user) return undefined;

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshUnreadCount();
    };
    const pollId = window.setInterval(refreshUnreadCount, 60000);

    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(pollId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshUnreadCount, user]);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }

  return context;
};

export { NotificationProvider, useNotifications };
