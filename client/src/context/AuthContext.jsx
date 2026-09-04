import { createContext, useContext, useEffect, useState } from "react";
import {
  getCurrentUser,
  logout as logoutService,
} from "../services/auth.service";
import channelService from "../services/channel.service";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [channel, setChannel] = useState(null);
  const [hasChannel, setHasChannel] = useState(false);
  const [loading, setLoading] = useState(true);

  // ==========================
  // Fetch My Channel
  // ==========================
  const fetchChannel = async () => {
    try {
      const res = await channelService.getMyChannel();
console.log(res);
      setChannel(res.data);
      setHasChannel(true);
    } catch (error) {
      setChannel(null);
      setHasChannel(false);
    }
  };

  // ==========================
  // Fetch Current User
  // ==========================
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("bharattube_token");

      if (!token) {
        setLoading(false);
        return;
      }

      const res = await getCurrentUser();

      setUser(res.data);

      // Check creator channel
      await fetchChannel();
    } catch (error) {
      setUser(null);
      setChannel(null);
      setHasChannel(false);

      localStorage.removeItem("bharattube_token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // ==========================
  // Logout
  // ==========================
  const logout = async () => {
    try {
      await logoutService();
    } catch (error) {
      console.log(error);
    } finally {
      setUser(null);
      setChannel(null);
      setHasChannel(false);

      localStorage.removeItem("bharattube_token");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,

        channel,
        hasChannel,

        loading,

        logout,

        getCurrentUser: fetchCurrentUser,
        refreshChannel: fetchChannel,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};