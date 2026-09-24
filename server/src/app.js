const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

// Routes
const authRoutes = require("./routes/auth.routes");
const channelRoutes = require("./routes/channel.routes");
const videoRoutes = require("./routes/video.routes");
const likeRoutes = require("./routes/like.routes");
const likedVideosRoutes = require("./routes/likedVideos.routes");
const commentRoutes = require("./routes/comment.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const watchHistoryRoutes = require("./routes/watchHistory.routes");
const watchRoutes = require("./routes/watch.routes");
const playlistRoutes = require("./routes/playlist.routes");
const viewRoutes = require("./routes/view.routes");
const notificationRoutes = require("./routes/notification.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const recommendationRoutes = require("./routes/recommendation.routes");
const searchRoutes = require("./routes/search.routes");
const shortsRoutes = require("./routes/shorts.routes");
const studioRoutes = require("./routes/studio.routes");
const monetizationRoutes = require("./routes/monetization.routes");
const walletRoutes = require("./routes/wallet.routes");
const withdrawRoutes = require("./routes/withdraw.routes");
const transactionRoutes = require("./routes/transaction.routes");
const adminRoutes = require("./routes/admin.routes");
const adminWithdrawRoutes = require("./routes/adminWithdraw.routes");
const settingsRoutes = require("./routes/settings.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const watchLaterRoutes = require("./routes/watchLater.routes");
const copyrightRoutes = require("./routes/copyright.routes");
const errorHandler = require("./middlewares/error.middleware");

// =========================
// ⭐ Crash Protection
// Server kabhi band nahi hoga
// =========================
process.on("uncaughtException", (err) => {
  console.error("🔴 Uncaught Exception:", err.message);
  console.error(err.stack);
  // Server band NAHI hoga
});

process.on("unhandledRejection", (reason) => {
  console.error("🔴 Unhandled Rejection:", reason);
  // Server band NAHI hoga
});

const app = express();

// ⭐ Render / reverse proxy
app.set("trust proxy", 1);

// =========================
// ⭐ Rate Limiters
// Alag alag routes ke liye
// =========================

// General limit — sab routes ke liye
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,                  // 300 requests per IP
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Health check pe limit mat lagao
    return req.path === "/";
  },
});

// Auth limit — Login/Signup spam rokne ke liye
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,                   // Sirf 20 login attempts
  message: {
    success: false,
    message: "Too many login attempts. Please try after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload limit — Video upload spam rokne ke liye
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,                   // Sirf 10 uploads per hour
  message: {
    success: false,
    message: "Upload limit reached. Please try after 1 hour.",
  },
});

// =========================
// Middlewares
// =========================

// ⭐ Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Videos ke liye off karo
}));

// ⭐ CORS — Frontend se connect hone ke liye
app.use(cors({
  origin: [
    "http://localhost:5173",     // Dev
    "http://localhost:3000",     // Dev alt
    "http://localhost",          // Capacitor Android WebView
    "https://bharattube.in",    // Production
    "https://www.bharattube.in",
      "https://bharattube-v.vercel.app", // Vercel
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ⭐ Compression — Responses fast honge
app.use(compression({
  level: 6,        // Balance between speed and compression
  threshold: 1024, // Sirf 1KB+ files compress karo
}));

// General Rate Limit
app.use(generalLimiter);

// ⭐ NoSQL Injection Protection
app.use(mongoSanitize());

// Body Parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Cookies
app.use(cookieParser());

// ⭐ Request Logger — Debugging ke liye
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    // Sirf slow requests log karo (500ms+)
    if (duration > 500) {
      console.warn(`⚠️ Slow Request: ${req.method} ${req.path} — ${duration}ms`);
    }
  });
  next();
});

// =========================
// Health Check
// Railway/Vercel ping karta hai
// =========================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 BharatTube API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    uptime: Math.floor(process.uptime()) + " seconds",
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
  });
});

// =========================
// API Routes
// =========================

// ⭐ Auth — Special rate limit
app.use("/api/v1/auth", authLimiter, authRoutes);

// ⭐ Video Upload — Special rate limit
app.use("/api/v1/videos", videoRoutes);

// All other routes
app.use("/api/v1/channel", channelRoutes);
app.use("/api/v1/likes", likeRoutes);
app.use("/api/v1/reactions", likeRoutes);
app.use("/api/v1/liked-videos", likedVideosRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/history", watchHistoryRoutes);
app.use("/api/v1/watch", watchRoutes);
app.use("/api/v1/playlists", playlistRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/views", viewRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/recommendations", recommendationRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/shorts", shortsRoutes);
app.use("/api/v1/studio", studioRoutes);
app.use("/api/v1/monetization", monetizationRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/withdraw", withdrawRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/admin/withdraw", adminWithdrawRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/watch-later", watchLaterRoutes);
app.use("/api/v1/copyright", copyrightRoutes);

// =========================
// 404 Handler
// =========================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route '${req.originalUrl}' not found`,
  });
});

// =========================
// Global Error Handler
// =========================
app.use(errorHandler);

module.exports = app;
