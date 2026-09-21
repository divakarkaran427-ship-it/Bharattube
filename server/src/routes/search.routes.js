const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const optionalAuth = require("../middlewares/optionalAuth.middleware");

const {
  recordSearchHistory,
  search,
} = require("../controllers/search.controller");

router.get("/", optionalAuth, search);

router.post("/history", authMiddleware, recordSearchHistory);

module.exports = router;