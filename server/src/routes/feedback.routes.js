const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { createFeedback } = require("../controllers/feedback.controller");

const router = express.Router();
router.post("/", authMiddleware, createFeedback);

module.exports = router;
