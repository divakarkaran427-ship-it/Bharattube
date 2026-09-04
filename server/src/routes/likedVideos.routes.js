const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const { getLikedVideos } = require("../controllers/likedVideos.controller");

router.get("/liked-videos", authMiddleware, getLikedVideos);

module.exports = router;
