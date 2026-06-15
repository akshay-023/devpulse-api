const express = require("express");
const {
  getOverview,
  getCommitAnalytics,
  getPullRequestAnalytics,
  getBurnoutRisk,
} = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/overview", protect, getOverview);
router.get("/commits/heatmap", protect, getCommitAnalytics);
router.get("/pull-requests", protect, getPullRequestAnalytics);
router.get("/burnout-risk", protect, getBurnoutRisk);

module.exports = router;