const {
  getAnalyticsOverview,
  getCommitStats,
  getCommitHeatmap,
  getPullRequestStats,
  calculateBurnoutRisk,
} = require("../services/analyticsService");

const {
  getCache,
  setCache,
  buildUserCacheKey,
} = require("../services/cacheService");

const ANALYTICS_CACHE_TTL = 15 * 60; // 15 minutes

const getOverview = async (req, res) => {
  try {
    const cacheKey = buildUserCacheKey(req.user.id, "analytics:overview");

    const cachedOverview = await getCache(cacheKey);

    if (cachedOverview) {
      return res.status(200).json({
        status: "success",
        source: "cache",
        data: cachedOverview,
      });
    }

    const overview = await getAnalyticsOverview(req.user.id);

    await setCache(cacheKey, overview, ANALYTICS_CACHE_TTL);

    res.status(200).json({
      status: "success",
      source: "database",
      data: overview,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to generate analytics overview",
      error: error.message,
    });
  }
};

const getCommitAnalytics = async (req, res) => {
  try {
    const cacheKey = buildUserCacheKey(req.user.id, "analytics:commits");

    const cachedCommits = await getCache(cacheKey);

    if (cachedCommits) {
      return res.status(200).json({
        status: "success",
        source: "cache",
        data: cachedCommits,
      });
    }

    const commitStats = await getCommitStats(req.user.id);
    const heatmap = await getCommitHeatmap(req.user.id);

    const data = {
      commitStats,
      heatmap,
    };

    await setCache(cacheKey, data, ANALYTICS_CACHE_TTL);

    res.status(200).json({
      status: "success",
      source: "database",
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to generate commit analytics",
      error: error.message,
    });
  }
};

const getPullRequestAnalytics = async (req, res) => {
  try {
    const cacheKey = buildUserCacheKey(req.user.id, "analytics:pull-requests");

    const cachedPullRequests = await getCache(cacheKey);

    if (cachedPullRequests) {
      return res.status(200).json({
        status: "success",
        source: "cache",
        data: cachedPullRequests,
      });
    }

    const pullRequestStats = await getPullRequestStats(req.user.id);

    await setCache(cacheKey, pullRequestStats, ANALYTICS_CACHE_TTL);

    res.status(200).json({
      status: "success",
      source: "database",
      data: pullRequestStats,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to generate pull request analytics",
      error: error.message,
    });
  }
};

const getBurnoutRisk = async (req, res) => {
  try {
    const cacheKey = buildUserCacheKey(req.user.id, "analytics:burnout-risk");

    const cachedBurnoutRisk = await getCache(cacheKey);

    if (cachedBurnoutRisk) {
      return res.status(200).json({
        status: "success",
        source: "cache",
        data: cachedBurnoutRisk,
      });
    }

    const burnoutRisk = await calculateBurnoutRisk(req.user.id);

    await setCache(cacheKey, burnoutRisk, ANALYTICS_CACHE_TTL);

    res.status(200).json({
      status: "success",
      source: "database",
      data: burnoutRisk,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to calculate burnout risk",
      error: error.message,
    });
  }
};

module.exports = {
  getOverview,
  getCommitAnalytics,
  getPullRequestAnalytics,
  getBurnoutRisk,
};