const {
  syncGitHubData,
  getUserRepositories,
  getUserCommits,
  getUserPullRequests,
} = require("../services/githubService");

const syncGitHub = async (req, res) => {
  try {
    const summary = await syncGitHubData(req.user.id);

    res.status(200).json({
      status: "success",
      message: "GitHub data sync completed",
      summary,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to sync GitHub data",
      error: error.message,
    });
  }
};

const getRepositories = async (req, res) => {
  try {
    const repositories = await getUserRepositories(req.user.id);

    res.status(200).json({
      status: "success",
      count: repositories.length,
      repositories,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch repositories",
      error: error.message,
    });
  }
};

const getCommits = async (req, res) => {
  try {
    const commits = await getUserCommits(req.user.id);

    res.status(200).json({
      status: "success",
      count: commits.length,
      commits,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch commits",
      error: error.message,
    });
  }
};

const getPullRequests = async (req, res) => {
  try {
    const pullRequests = await getUserPullRequests(req.user.id);

    res.status(200).json({
      status: "success",
      count: pullRequests.length,
      pullRequests,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch pull requests",
      error: error.message,
    });
  }
};

module.exports = {
  syncGitHub,
  getRepositories,
  getCommits,
  getPullRequests,
};