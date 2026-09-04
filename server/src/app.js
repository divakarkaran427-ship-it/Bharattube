const express = require("express");
const cors = require("cors");


const authRoutes = require("./routes/auth.routes");

const channelRoutes = require("./routes/channel.routes");
const videoRoutes = require("./routes/video.routes");
const likeRoutes = require("./routes/like.routes");
const reactionRoutes = require("./routes/like.routes");
const likedVideosRoutes = require("./routes/likedVideos.routes");

const cookieParser = require("cookie-parser");
const commentRoutes = require("./routes/comment.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const watchHistoryRoutes = require("./routes/watchHistory.routes");
const watchRoutes = require("./routes/watch.routes");
const playlistRoutes = require("./routes/playlist.routes");
const viewRoutes = require("./routes/view.routes");
const notificationRoutes = require("./routes/notification.routes");
const errorHandler = require("./middlewares/error.middleware");
const dashboardRoutes = require("./routes/dashboard.routes");
const recommendationRoutes = require("./routes/recommendation.routes");
const searchRoutes = require("./routes/search.routes");
const shortsRoutes = require("./routes/shorts.routes");
const studioRoutes = require("./routes/studio.routes");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
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

const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  max: 300,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =========================
// Middlewares
// =========================

// Security Headers
app.use(helmet());

// CORS must run before rate limiting so error responses include CORS headers.
app.use(cors());

// Response Compression
app.use(compression());

// Rate Limiting
app.use(limiter);

// Prevent NoSQL Injection
app.use(mongoSanitize());

// Body Parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({
  extended: true,
  limit: "50mb",
}));

// Cookies
app.use(cookieParser());
// =========================
// Health Check
// =========================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 Welcome to BharatTube API",
  });
});

// =========================
// API Routes
// =========================

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/channel", channelRoutes);
app.use("/api/v1/videos", videoRoutes);
app.use("/api/v1/likes", likeRoutes);
app.use("/api/v1/reactions", reactionRoutes);
app.use("/api/v1/reactions", likedVideosRoutes);
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
// 404 Route
// =========================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

// =========================
// Global Error Handler
// =========================

app.use(errorHandler);

module.exports = app;
