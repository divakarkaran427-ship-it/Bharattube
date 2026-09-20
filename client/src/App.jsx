import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    const backButtonListener = CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) navigate(-1);
      else CapacitorApp.exitApp();
    });

    return () => {
      backButtonListener.then((listener) => listener.remove());
    };
  }, [navigate]);

  const hideLayout =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/auth/google/callback";

  if (hideLayout) {
    return <AppRoutes />;
  }

  return (
    <Layout>
      <AppRoutes />
    </Layout>
  );
}

export default App;
