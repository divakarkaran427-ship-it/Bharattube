const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const authMiddleware = async (req, res, next) => {
  try {
    console.log("========== AUTH MIDDLEWARE ==========");

    let token = req.header("Authorization");

    console.log("Authorization Header:", token);

    if (!token) {
      console.log("❌ No Authorization Header");

      return res.status(401).json({
        success: false,
        message: "Access Denied. No Token Provided.",
      });
    }

    if (token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }

    console.log("Extracted Token:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded Token:", decoded);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.log("❌ User Not Found");

      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    console.log("✅ Authenticated User:", user.email);

    req.user = user;

    next();
  } catch (error) {
    console.log("❌ JWT Error:", error);

    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = authMiddleware;