import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
import Watch from "../pages/Watch/Watch";
import Login from "../pages/Login/Login";
import Signup from "../pages/Signup/Signup";
import Upload from "../pages/Upload/Upload";
import Create from "../pages/Create/Create";
import CreatorDashboard from "../pages/CreatorDashboard/CreatorDashboard";
import ProtectedRoute from "./ProtectedRoute";
import GoogleAuthCallback from "../pages/GoogleAuthCallback/GoogleAuthCallback";
import Channel from "../pages/Channel/Channel";
import History from "../pages/History/History";
import Notifications from "../pages/Notifications/Notifications";
import Shorts from "../pages/Shorts/Shorts";
import Playlists from "../pages/Playlists/Playlists";
import PlaylistDetail from "../pages/PlaylistDetail/PlaylistDetail";
import LikedVideos from "../pages/LikedVideos/LikedVideos";
import WatchLater from "../pages/WatchLater/WatchLater";
import Settings from "../pages/Settings/Settings";
import Help from "../pages/Help/Help";
import Feedback from "../pages/Feedback/Feedback";
import CreateChannel from "../pages/CreateChannel/CreateChannel"; // ⭐ Added
import EditChannel from "../pages/EditChannel/EditChannel";
import AdminCopyrightMatches from "../pages/AdminCopyrightMatches/AdminCopyrightMatches";
import CopyrightClaims from "../pages/CopyrightClaims/CopyrightClaims";
import Subscriptions from "../pages/Subscriptions/Subscriptions";
import You from "../pages/You/You";
import Search from "../pages/Search/Search";
import AdminDashboard from "../pages/AdminDashboard/AdminDashboard";

function PlaceholderPage({ title, description }) {
  return (
    <main style={{ padding: "32px 20px", color: "#f8fafc" }}>
      <h1 style={{ marginBottom: "8px", fontSize: "1.6rem" }}>{title}</h1>
      <p style={{ margin: 0, color: "#94a3b8" }}>{description}</p>
    </main>
  );
}

function AppRoutes() {
  return (
    
    <Routes>
      {/* Public Routes */}

      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Search />} />
      <Route path="/watch/:id" element={<Watch />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
      <Route path="/shorts" element={<Shorts />} />
      <Route path="/subscriptions" element={<Subscriptions />} />
      <Route path="/help" element={<Help />} />
      <Route path="/channel/:handle" element={<Channel />} />

      {/* Protected Routes */}
      <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
      <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />

      {/* ⭐ Create Channel Route */}
      <Route path="/create-channel" element={<ProtectedRoute><CreateChannel /></ProtectedRoute>} />

      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/playlists" element={<ProtectedRoute><Playlists /></ProtectedRoute>} />
      <Route path="/playlists/:id" element={<ProtectedRoute><PlaylistDetail /></ProtectedRoute>} />
      <Route path="/liked-videos" element={<ProtectedRoute><LikedVideos /></ProtectedRoute>} />
      <Route path="/watch-later" element={<ProtectedRoute><WatchLater /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/you" element={<ProtectedRoute><You /></ProtectedRoute>} />
      <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
      <Route path="/studio" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
      <Route path="/admin/copyright-matches" element={<ProtectedRoute><AdminCopyrightMatches /></ProtectedRoute>} />
      <Route path="/copyright/claims" element={<ProtectedRoute><CopyrightClaims /></ProtectedRoute>} />

      <Route path="/wallet" element={<ProtectedRoute><PlaceholderPage title="Wallet" description="Your wallet experience is being built." /> </ProtectedRoute>} />
      <Route path="/appearance"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Appearance" description="Customize interface theme and viewing preferences here." />
          </ProtectedRoute>
        }
      />
      <Route
        path="/language"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Language" description="Choose your preferred interface language here." />
          </ProtectedRoute>
        }
      />
      <Route
        path="/channel/edit"
        element={
          <ProtectedRoute>
            <EditChannel />
          </ProtectedRoute>
        }
      />
      
    </Routes>
    
  );
}

export default AppRoutes;