const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// =========================
// ⭐ MongoDB Connect
// =========================
const connectDB = async () => {
  if (!MONGODB_URI) {
    console.error("❌ MongoDB URI is missing. Add MONGO_URI to server/.env");
    return false;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,              // 10 connections ready
      serverSelectionTimeoutMS: 5000, // 5 sec timeout
      socketTimeoutMS: 45000,       // 45 sec socket timeout
    });
    console.log("✅ MongoDB Connected!");
    return true;
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err.message);
    // 5 second baad retry karo
    setTimeout(connectDB, 5000);
    return false;
  }
};

// MongoDB disconnect pe reconnect karo
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB Disconnected! Reconnecting...");
  setTimeout(connectDB, 3000);
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB Error:", err.message);
});

// =========================
// ⭐ Server Start
// =========================
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🚀 BharatTube API Ready!`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  });

  // ⭐ Graceful Shutdown
  // Server properly band hoga — data loss nahi hoga
  const gracefulShutdown = (signal) => {
    console.log(`\n⚠️ ${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      console.log("✅ HTTP server closed.");

      try {
        await mongoose.connection.close();
        console.log("✅ MongoDB connection closed.");
      } catch (err) {
        console.error("❌ Error closing MongoDB:", err.message);
      }

      process.exit(0);
    });

    // 10 sec mein force close
    setTimeout(() => {
      console.error("⚠️ Force closing server...");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // ⭐ Server timeout — hung requests handle
  server.timeout = 30000; // 30 seconds

  return server;
};

startServer();