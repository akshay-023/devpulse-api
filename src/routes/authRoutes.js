const express = require("express");
const { passport } = require("../config/passport");
const {
  githubCallback,
  getMe,
  logout,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email", "repo"],
    session: false,
  })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/api/auth/failure",
    session: false,
  }),
  githubCallback
);

router.get("/failure", (req, res) => {
  res.status(401).json({
    status: "error",
    message: "GitHub authentication failed",
  });
});

router.get("/me", protect, getMe);

router.post("/logout", protect, logout);

module.exports = router;