const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const optionalAuth = async (req, res, next) => {
  try {
    let token = req.header("Authorization");

    if (!token) return next();

    if (token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (user) req.user = user;

    next();
  } catch (error) {
    next();
  }
};

module.exports = optionalAuth;