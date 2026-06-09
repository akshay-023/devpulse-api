const express = require("express");
const {
  syncGitHub,
  getRepositories,
  getCommits,
  getPullRequests,
} = require("../controllers/githubController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/sync", protect, syncGitHub);
router.get("/repos", protect, getRepositories);
router.get("/commits", protect, getCommits);
router.get("/pull-requests", protect, getPullRequests);

module.exports = router;