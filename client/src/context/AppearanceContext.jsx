import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const AppearanceContext = createContext();

const themes = [
  { id: "midnight", label: "Midnight", background: "#0f0f0f", surface: "#17171a", accent: "#ff4f2e" },
  { id: "ocean", label: "Ocean", background: "#071a2a", surface: "#0d2b42", accent: "#29b6f6" },
  { id: "forest", label: "Forest", background: "#0b2119", surface: "#12362a", accent: "#45c878" },
  { id: "plum", label: "Plum", background: "#211126", surface: "#38203e", accent: "#cf68e8" },
  { id: "sunset", label: "Sunset", background: "#291510", surface: "#442319", accent: "#ff8a3d" },
  { id: "pearl", label: "Pearl", background: "#ffffff", surface: "#ffffff", accent: "#ff0033" },
];

const getStorageKey = (userId) => `bharattube_preferences_${userId || "guest"}`;

function AppearanceProvider({ children }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({ themeId: "midnight", language: "English" });

  useEffect(() => {
    try {
      const storedPreferences = JSON.parse(localStorage.getItem(getStorageKey(user?._id)) || "{}");
      setPreferences({ themeId: "midnight", language: "English", ...storedPreferences });
    } catch {
      setPreferences({ themeId: "midnight", language: "English" });
    }
  }, [user?._id]);

  const activeTheme = useMemo(
    () => themes.find((theme) => theme.id === preferences.themeId) || themes[0],
    [preferences.themeId]
  );

  useEffect(() => {
    const root = document.documentElement;
    const isLightTheme = activeTheme.id === "pearl";
    root.style.setProperty("--app-background", activeTheme.background);
    root.style.setProperty("--app-surface", activeTheme.surface);
    root.style.setProperty("--app-accent", activeTheme.accent);
    root.style.setProperty("--app-text", isLightTheme ? "#0f0f0f" : "#f7f7f7");
    root.style.setProperty("--app-muted", isLightTheme ? "#606060" : "#aaaaaa");
    root.style.setProperty("--app-card", isLightTheme ? "#ffffff" : "#17171a");
    root.style.setProperty("--app-sidebar", isLightTheme ? "#ffffff" : "#111111");
    root.style.setProperty("--app-border", isLightTheme ? "#e2e5ea" : "#2a2a2e");
    root.style.setProperty("--app-chip", isLightTheme ? "#f0f1f3" : "#272727");
    root.style.setProperty("--app-chip-hover", isLightTheme ? "#e2e4e8" : "#3f3f3f");
    root.style.setProperty("--app-chip-active", isLightTheme ? "#0f0f0f" : "#ffffff");
    root.style.setProperty("--app-chip-active-text", isLightTheme ? "#ffffff" : "#000000");
  }, [activeTheme]);

  const updatePreferences = useCallback((updates) => {
    setPreferences((currentPreferences) => {
      const nextPreferences = { ...currentPreferences, ...updates };
      localStorage.setItem(getStorageKey(user?._id), JSON.stringify(nextPreferences));
      return nextPreferences;
    });
  }, [user?._id]);

  return (
    <AppearanceContext.Provider value={{ activeTheme, preferences, themes, updatePreferences }}>
      {children}
    </AppearanceContext.Provider>
  );
}

const useAppearance = () => {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error("useAppearance must be used within an AppearanceProvider");
  return context;
};

export { AppearanceProvider, useAppearance };
