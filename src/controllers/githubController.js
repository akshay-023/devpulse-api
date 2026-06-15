const {
  syncGitHubData,
  getUserRepositories,
  getUserCommits,
  getUserPullRequests,
} = require("../services/githubService");

const {
  getCache,
  setCache,
  deleteCacheByPattern,
  buildUserCacheKey,
} = require("../services/cacheService");

const CACHE_TTL = {
  REPOSITORIES: 60 * 60, // 1 hour
  COMMITS: 30 * 60, // 30 minutes
  PULL_REQUESTS: 30 * 60, // 30 minutes
};

const syncGitHub = async (req, res) => {
  try {
    const summary = await syncGitHubData(req.user.id);

    await deleteCacheByPattern(`user:${req.user.id}:github:*`);
    await deleteCacheByPattern(`user:${req.user.id}:analytics:*`);

    res.status(200).json({
      status: "success",
      message: "GitHub data sync completed",
      summary,
      cache: {
        invalidated: true,
        reason: "Fresh GitHub data synced",
      },
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
    const cacheKey = buildUserCacheKey(req.user.id, "github:repos");

    const cachedRepositories = await getCache(cacheKey);

    if (cachedRepositories) {
      return res.status(200).json({
        status: "success",
        source: "cache",
        count: cachedRepositories.length,
        repositories: cachedRepositories,
      });
    }

    const repositories = await getUserRepositories(req.user.id);

    await setCache(cacheKey, repositories, CACHE_TTL.REPOSITORIES);

    res.status(200).json({
      status: "success",
      source: "database",
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
    const cacheKey = buildUserCacheKey(req.user.id, "github:commits");

    const cachedCommits = await getCache(cacheKey);

    if (cachedCommits) {
      return res.status(200).json({
        status: "success",
        source: "cache",
        count: cachedCommits.length,
        commits: cachedCommits,
      });
    }

    const commits = await getUserCommits(req.user.id);

    await setCache(cacheKey, commits, CACHE_TTL.COMMITS);

    res.status(200).json({
      status: "success",
      source: "database",
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
    const cacheKey = buildUserCacheKey(req.user.id, "github:pull-requests");

    const cachedPullRequests = await getCache(cacheKey);

    if (cachedPullRequests) {
      return res.status(200).json({
        status: "success",
        source: "cache",
        count: cachedPullRequests.length,
        pullRequests: cachedPullRequests,
      });
    }

    const pullRequests = await getUserPullRequests(req.user.id);

    await setCache(cacheKey, pullRequests, CACHE_TTL.PULL_REQUESTS);

    res.status(200).json({
      status: "success",
      source: "database",
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