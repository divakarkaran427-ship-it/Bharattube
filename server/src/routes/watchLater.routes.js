const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const {
  addToWatchLater,
  getMyWatchLater,
  removeFromWatchLater,
} = require("../controllers/watchLater.controller");

router.get("/", authMiddleware, getMyWatchLater);
router.post("/:videoId", authMiddleware, addToWatchLater);
router.delete("/:videoId", authMiddleware, removeFromWatchLater);

module.exports = router;
