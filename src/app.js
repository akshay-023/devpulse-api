const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { passport } = require("./config/passport");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const githubRoutes = require("./routes/githubRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use(passport.initialize());

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to DevPulse API",
  });
});

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

module.exports = app;