const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");
const {
  listPendingCopyrightMatches,
  reviewCopyrightMatch,
} = require("../controllers/copyrightMatchResult.controller");
const { createClaimFromReviewedMatch } = require("../controllers/copyrightMatchClaim.controller");
const { createCopyrightReference } = require("../controllers/copyrightReference.controller");
const {
  getCreatorCopyrightClaims,
  createCopyrightClaim,
} = require("../controllers/copyrightClaim.controller");
const { createCopyrightDispute, reviewCopyrightDispute } = require("../controllers/copyrightDispute.controller");
const { createCopyrightTakedown, reviewCopyrightTakedown } = require("../controllers/copyrightTakedown.controller");
const {
  createCopyrightStrike,
  reviewCopyrightStrike,
  createStrikeAppeal,
  getStrikes,
  getStrikeById,
} = require("../controllers/copyrightStrike.controller");

router.post("/references", authMiddleware, createCopyrightReference);
router.get("/claims", authMiddleware, getCreatorCopyrightClaims);
router.post("/claims", authMiddleware, createCopyrightClaim);
router.post("/claims/:claimId/disputes", authMiddleware, createCopyrightDispute);
router.patch("/disputes/:disputeId/status", authMiddleware, reviewCopyrightDispute);
router.post("/takedowns", authMiddleware, createCopyrightTakedown);
router.patch("/takedowns/:takedownId/status", authMiddleware, reviewCopyrightTakedown);
router.post("/strikes", authMiddleware, createCopyrightStrike);
router.patch("/strikes/:strikeId/status", authMiddleware, reviewCopyrightStrike);
router.post("/strikes/:strikeId/appeals", authMiddleware, createStrikeAppeal);
router.get("/strikes", authMiddleware, getStrikes);
router.get("/strikes/:strikeId", authMiddleware, getStrikeById);

router.get("/matches", authMiddleware, adminMiddleware, listPendingCopyrightMatches);
router.patch(
  "/matches/:matchResultId/review",
  authMiddleware,
  adminMiddleware,
  reviewCopyrightMatch
);
router.post(
  "/matches/:matchResultId/claim",
  authMiddleware,
  adminMiddleware,
  createClaimFromReviewedMatch
);

module.exports = router;
