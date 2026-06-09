const axios = require("axios");
const { pool } = require("../config/db");

const GITHUB_API_BASE_URL = "https://api.github.com";

const createGitHubClient = (accessToken) => {
  return axios.create({
    baseURL: GITHUB_API_BASE_URL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
};

const getAuthenticatedUserToken = async (userId) => {
  const result = await pool.query(
    "SELECT access_token_encrypted FROM users WHERE id = $1",
    [userId]
  );

  if (result.rows.length === 0 || !result.rows[0].access_token_encrypted) {
    throw new Error("GitHub access token not found for user");
  }

  return result.rows[0].access_token_encrypted;
};

const fetchUserRepositories = async (githubClient) => {
  const response = await githubClient.get("/user/repos", {
    params: {
      sort: "updated",
      direction: "desc",
      per_page: 5,
      affiliation: "owner,collaborator",
    },
  });

  return response.data;
};

const fetchRepositoryCommits = async (githubClient, owner, repo) => {
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 90);

  const response = await githubClient.get(`/repos/${owner}/${repo}/commits`, {
    params: {
      since: sinceDate.toISOString(),
      per_page: 30,
    },
  });

  return response.data;
};

const fetchRepositoryPullRequests = async (githubClient, owner, repo) => {
  const response = await githubClient.get(`/repos/${owner}/${repo}/pulls`, {
    params: {
      state: "all",
      sort: "updated",
      direction: "desc",
      per_page: 20,
    },
  });

  return response.data;
};

const saveRepository = async (userId, repo) => {
  const result = await pool.query(
    `INSERT INTO repositories
      (user_id, github_repo_id, name, full_name, private, language, html_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (github_repo_id)
     DO UPDATE SET
       name = EXCLUDED.name,
       full_name = EXCLUDED.full_name,
       private = EXCLUDED.private,
       language = EXCLUDED.language,
       html_url = EXCLUDED.html_url,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [
      userId,
      repo.id,
      repo.name,
      repo.full_name,
      repo.private,
      repo.language,
      repo.html_url,
    ]
  );

  return result.rows[0];
};

const saveCommit = async (userId, repoId, commit) => {
  const commitDate = commit.commit?.author?.date || commit.commit?.committer?.date;

  if (!commit.sha || !commitDate) {
    return null;
  }

  const result = await pool.query(
    `INSERT INTO commits
      (repo_id, user_id, sha, message, additions, deletions, committed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (sha)
     DO UPDATE SET
       message = EXCLUDED.message,
       committed_at = EXCLUDED.committed_at
     RETURNING *`,
    [
      repoId,
      userId,
      commit.sha,
      commit.commit?.message || "",
      0,
      0,
      commitDate,
    ]
  );

  return result.rows[0];
};

const savePullRequest = async (userId, repoId, pullRequest) => {
  const result = await pool.query(
    `INSERT INTO pull_requests
      (repo_id, user_id, github_pr_id, number, title, state, created_at_github, merged_at, closed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (github_pr_id)
     DO UPDATE SET
       title = EXCLUDED.title,
       state = EXCLUDED.state,
       merged_at = EXCLUDED.merged_at,
       closed_at = EXCLUDED.closed_at
     RETURNING *`,
    [
      repoId,
      userId,
      pullRequest.id,
      pullRequest.number,
      pullRequest.title,
      pullRequest.state,
      pullRequest.created_at,
      pullRequest.merged_at,
      pullRequest.closed_at,
    ]
  );

  return result.rows[0];
};

const syncGitHubData = async (userId) => {
  const accessToken = await getAuthenticatedUserToken(userId);
  const githubClient = createGitHubClient(accessToken);

  const repositories = await fetchUserRepositories(githubClient);

  let repositoriesSynced = 0;
  let commitsSynced = 0;
  let pullRequestsSynced = 0;

  for (const repo of repositories) {
    const savedRepo = await saveRepository(userId, repo);
    repositoriesSynced += 1;

    const [owner, repoName] = repo.full_name.split("/");

    try {
      const commits = await fetchRepositoryCommits(githubClient, owner, repoName);

      for (const commit of commits) {
        const savedCommit = await saveCommit(userId, savedRepo.id, commit);
        if (savedCommit) {
          commitsSynced += 1;
        }
      }
    } catch (error) {
      console.error(`Failed to sync commits for ${repo.full_name}:`, error.message);
    }

    try {
      const pullRequests = await fetchRepositoryPullRequests(
        githubClient,
        owner,
        repoName
      );

      for (const pullRequest of pullRequests) {
        const savedPullRequest = await savePullRequest(
          userId,
          savedRepo.id,
          pullRequest
        );

        if (savedPullRequest) {
          pullRequestsSynced += 1;
        }
      }
    } catch (error) {
      console.error(`Failed to sync pull requests for ${repo.full_name}:`, error.message);
    }
  }

  return {
    repositoriesSynced,
    commitsSynced,
    pullRequestsSynced,
  };
};

const getUserRepositories = async (userId) => {
  const result = await pool.query(
    `SELECT id, github_repo_id, name, full_name, private, language, html_url, created_at, updated_at
     FROM repositories
     WHERE user_id = $1
     ORDER BY updated_at DESC`,
    [userId]
  );

  return result.rows;
};

const getUserCommits = async (userId) => {
  const result = await pool.query(
    `SELECT
       commits.id,
       commits.sha,
       commits.message,
       commits.additions,
       commits.deletions,
       commits.committed_at,
       repositories.name AS repository_name,
       repositories.full_name AS repository_full_name
     FROM commits
     JOIN repositories ON commits.repo_id = repositories.id
     WHERE commits.user_id = $1
     ORDER BY commits.committed_at DESC
     LIMIT 100`,
    [userId]
  );

  return result.rows;
};

const getUserPullRequests = async (userId) => {
  const result = await pool.query(
    `SELECT
       pull_requests.id,
       pull_requests.github_pr_id,
       pull_requests.number,
       pull_requests.title,
       pull_requests.state,
       pull_requests.created_at_github,
       pull_requests.merged_at,
       pull_requests.closed_at,
       repositories.name AS repository_name,
       repositories.full_name AS repository_full_name
     FROM pull_requests
     JOIN repositories ON pull_requests.repo_id = repositories.id
     WHERE pull_requests.user_id = $1
     ORDER BY pull_requests.created_at_github DESC
     LIMIT 100`,
    [userId]
  );

  return result.rows;
};

module.exports = {
  syncGitHubData,
  getUserRepositories,
  getUserCommits,
  getUserPullRequests,
};