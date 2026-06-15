const { pool } = require("../config/db");

const getAnalyticsOverview = async (userId) => {
  const commitStats = await getCommitStats(userId);
  const pullRequestStats = await getPullRequestStats(userId);
  const burnoutRisk = await calculateBurnoutRisk(userId);

  const productivityScore = calculateProductivityScore({
    commitCount: commitStats.totalCommits,
    avgPrMergeTimeHours: pullRequestStats.avgPrMergeTimeHours,
    lateNightActivityPercent: burnoutRisk.signals.lateNightActivityPercent,
    weekendActivityPercent: burnoutRisk.signals.weekendActivityPercent,
  });

  return {
    commitStats,
    pullRequestStats,
    productivityScore,
    burnoutRisk,
  };
};

const getCommitStats = async (userId) => {
  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS total_commits,
       COALESCE(SUM(additions), 0)::int AS total_additions,
       COALESCE(SUM(deletions), 0)::int AS total_deletions,
       MIN(committed_at) AS first_commit_at,
       MAX(committed_at) AS latest_commit_at
     FROM commits
     WHERE user_id = $1`,
    [userId]
  );

  const row = result.rows[0];

  const totalAdditions = Number(row.total_additions || 0);
  const totalDeletions = Number(row.total_deletions || 0);

  const codeChurnRatio =
    totalAdditions + totalDeletions === 0
      ? 0
      : Number((totalDeletions / (totalAdditions + totalDeletions)).toFixed(2));

  return {
    totalCommits: Number(row.total_commits || 0),
    totalAdditions,
    totalDeletions,
    codeChurnRatio,
    firstCommitAt: row.first_commit_at,
    latestCommitAt: row.latest_commit_at,
  };
};

const getCommitHeatmap = async (userId) => {
  const result = await pool.query(
    `SELECT
       TO_CHAR(committed_at, 'Dy') AS day,
       EXTRACT(DOW FROM committed_at)::int AS day_number,
       EXTRACT(HOUR FROM committed_at)::int AS hour,
       COUNT(*)::int AS commit_count
     FROM commits
     WHERE user_id = $1
     GROUP BY day, day_number, hour
     ORDER BY day_number, hour`,
    [userId]
  );

  return result.rows.map((row) => ({
    day: row.day.trim(),
    dayNumber: row.day_number,
    hour: row.hour,
    commitCount: row.commit_count,
  }));
};

const getPullRequestStats = async (userId) => {
  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS total_pull_requests,
       COUNT(*) FILTER (WHERE state = 'open')::int AS open_pull_requests,
       COUNT(*) FILTER (WHERE state = 'closed')::int AS closed_pull_requests,
       COUNT(*) FILTER (WHERE merged_at IS NOT NULL)::int AS merged_pull_requests,
       AVG(EXTRACT(EPOCH FROM (merged_at - created_at_github)) / 3600)
         FILTER (WHERE merged_at IS NOT NULL AND created_at_github IS NOT NULL)
         AS avg_pr_merge_time_hours
     FROM pull_requests
     WHERE user_id = $1`,
    [userId]
  );

  const row = result.rows[0];

  return {
    totalPullRequests: Number(row.total_pull_requests || 0),
    openPullRequests: Number(row.open_pull_requests || 0),
    closedPullRequests: Number(row.closed_pull_requests || 0),
    mergedPullRequests: Number(row.merged_pull_requests || 0),
    avgPrMergeTimeHours: row.avg_pr_merge_time_hours
      ? Number(Number(row.avg_pr_merge_time_hours).toFixed(2))
      : 0,
  };
};

const calculateBurnoutRisk = async (userId) => {
  const lateNightResult = await pool.query(
    `SELECT COUNT(*)::int AS late_night_commits
     FROM commits
     WHERE user_id = $1
       AND (
         EXTRACT(HOUR FROM committed_at) >= 22
         OR EXTRACT(HOUR FROM committed_at) < 6
       )`,
    [userId]
  );

  const weekendResult = await pool.query(
    `SELECT COUNT(*)::int AS weekend_commits
     FROM commits
     WHERE user_id = $1
       AND EXTRACT(DOW FROM committed_at) IN (0, 6)`,
    [userId]
  );

  const totalResult = await pool.query(
    `SELECT COUNT(*)::int AS total_commits
     FROM commits
     WHERE user_id = $1`,
    [userId]
  );

  const recentTrendResult = await pool.query(
    `SELECT
       COUNT(*) FILTER (
         WHERE committed_at >= NOW() - INTERVAL '7 days'
       )::int AS current_week_commits,
       COUNT(*) FILTER (
         WHERE committed_at >= NOW() - INTERVAL '14 days'
           AND committed_at < NOW() - INTERVAL '7 days'
       )::int AS previous_week_commits
     FROM commits
     WHERE user_id = $1`,
    [userId]
  );

  const totalCommits = Number(totalResult.rows[0].total_commits || 0);
  const lateNightCommits = Number(lateNightResult.rows[0].late_night_commits || 0);
  const weekendCommits = Number(weekendResult.rows[0].weekend_commits || 0);

  const currentWeekCommits = Number(
    recentTrendResult.rows[0].current_week_commits || 0
  );
  const previousWeekCommits = Number(
    recentTrendResult.rows[0].previous_week_commits || 0
  );

  const lateNightActivityPercent =
    totalCommits === 0
      ? 0
      : Number(((lateNightCommits / totalCommits) * 100).toFixed(2));

  const weekendActivityPercent =
    totalCommits === 0
      ? 0
      : Number(((weekendCommits / totalCommits) * 100).toFixed(2));

  const commitDropPercent =
    previousWeekCommits === 0
      ? 0
      : Number(
          (((previousWeekCommits - currentWeekCommits) / previousWeekCommits) *
            100).toFixed(2)
        );

  let burnoutScore = 0;

  if (lateNightActivityPercent > 30) burnoutScore += 30;
  else if (lateNightActivityPercent > 15) burnoutScore += 15;

  if (weekendActivityPercent > 40) burnoutScore += 25;
  else if (weekendActivityPercent > 20) burnoutScore += 10;

  if (commitDropPercent > 50) burnoutScore += 30;
  else if (commitDropPercent > 25) burnoutScore += 15;

  if (totalCommits > 60 && lateNightActivityPercent > 20) burnoutScore += 15;

  let riskLevel = "Low";

  if (burnoutScore >= 66) {
    riskLevel = "High";
  } else if (burnoutScore >= 31) {
    riskLevel = "Medium";
  }

  const recommendations = [];

  if (lateNightActivityPercent > 15) {
    recommendations.push("Reduce late-night coding activity to improve recovery.");
  }

  if (weekendActivityPercent > 20) {
    recommendations.push("Avoid frequent weekend work to maintain sustainable productivity.");
  }

  if (commitDropPercent > 25) {
    recommendations.push("Commit activity dropped compared to last week. Review workload or blockers.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Activity pattern looks sustainable based on current data.");
  }

  return {
    score: burnoutScore,
    riskLevel,
    signals: {
      totalCommits,
      lateNightCommits,
      weekendCommits,
      currentWeekCommits,
      previousWeekCommits,
      lateNightActivityPercent,
      weekendActivityPercent,
      commitDropPercent,
    },
    recommendations,
  };
};

const calculateProductivityScore = ({
  commitCount,
  avgPrMergeTimeHours,
  lateNightActivityPercent,
  weekendActivityPercent,
}) => {
  let score = 50;

  if (commitCount >= 30) score += 25;
  else if (commitCount >= 15) score += 15;
  else if (commitCount >= 5) score += 8;

  if (avgPrMergeTimeHours > 0 && avgPrMergeTimeHours <= 24) score += 15;
  else if (avgPrMergeTimeHours > 24 && avgPrMergeTimeHours <= 72) score += 8;

  if (lateNightActivityPercent > 30) score -= 15;
  else if (lateNightActivityPercent > 15) score -= 8;

  if (weekendActivityPercent > 40) score -= 10;
  else if (weekendActivityPercent > 20) score -= 5;

  if (score > 100) return 100;
  if (score < 0) return 0;

  return score;
};

module.exports = {
  getAnalyticsOverview,
  getCommitStats,
  getCommitHeatmap,
  getPullRequestStats,
  calculateBurnoutRisk,
};