const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const jwt = require("jsonwebtoken");
const { pool } = require("./db");

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ["user:email", "repo"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const githubId = profile.id;
        const username = profile.username;
        const email =
          profile.emails && profile.emails.length > 0
            ? profile.emails[0].value
            : null;
        const avatarUrl =
          profile.photos && profile.photos.length > 0
            ? profile.photos[0].value
            : null;

        const existingUser = await pool.query(
          "SELECT * FROM users WHERE github_id = $1",
          [githubId]
        );

        let user;

        if (existingUser.rows.length > 0) {
          const updatedUser = await pool.query(
            `UPDATE users
             SET username = $1,
                 email = $2,
                 avatar_url = $3,
                 access_token_encrypted = $4,
                 updated_at = CURRENT_TIMESTAMP
             WHERE github_id = $5
             RETURNING id, github_id, username, email, avatar_url, created_at, updated_at`,
            [username, email, avatarUrl, accessToken, githubId]
          );

          user = updatedUser.rows[0];
        } else {
          const newUser = await pool.query(
            `INSERT INTO users
             (github_id, username, email, avatar_url, access_token_encrypted)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, github_id, username, email, avatar_url, created_at, updated_at`,
            [githubId, username, email, avatarUrl, accessToken]
          );

          user = newUser.rows[0];
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      githubId: user.github_id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

module.exports = {
  passport,
  generateToken,
};