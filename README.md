# DevPulse — Developer Productivity Intelligence API

DevPulse is a backend-focused API that connects with GitHub and analyzes developer productivity patterns such as commits, pull requests, code churn, review activity, and burnout risk signals.

The goal of this project is to demonstrate production-style backend engineering using real external APIs, authentication, caching, database design, API documentation, Docker, and CI/CD.

---

## Project Goal

Engineering teams often struggle to understand developer workflow patterns, pull request bottlenecks, code churn, and burnout signals.

DevPulse solves this by collecting GitHub activity and converting it into meaningful developer productivity insights.

---

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Redis
- Docker
- GitHub OAuth
- GitHub REST API
- GitHub Webhooks
- Swagger
- GitHub Actions

---

## Day 1 Progress

- Set up Express.js backend server
- Created clean backend folder structure
- Added environment variable configuration
- Added health check API endpoint
- Added Dockerfile
- Added Docker Compose foundation
- Added `.env.example` for safe environment setup
- Added `.gitignore` to protect secrets and dependencies
- Pushed clean project setup to GitHub

---

## Day 2 Progress

- Added PostgreSQL database using Docker
- Created production-style relational database schema
- Added database connection using `pg`
- Added database initialization script
- Added health check endpoint with database connectivity status
- Created tables for users, repositories, commits, pull requests, reviews, weekly reports, and webhook events

---

## Day 3 Progress

- Created GitHub OAuth App for local authentication
- Integrated Passport.js with GitHub OAuth strategy
- Added GitHub login and callback routes
- Saved authenticated GitHub users into PostgreSQL
- Generated JWT token after successful GitHub login
- Added protected `/api/auth/me` route
- Added logout endpoint for client-side token removal

---

### Day 4 — GitHub Data Sync

- Added GitHub REST API integration using authenticated OAuth access token
- Created GitHub service layer using Axios
- Synced authenticated user repositories into PostgreSQL
- Synced recent commits from GitHub repositories
- Synced pull request data from GitHub repositories
- Added protected GitHub data endpoints
- Added database-backed repository, commit, and pull request retrieval APIs

---

## API Endpoints

### Authentication Endpoints

| Method | Endpoint                    | Description                          |
| ------ | --------------------------- | ------------------------------------ |
| GET    | `/api/auth/github`          | Start GitHub OAuth login             |
| GET    | `/api/auth/github/callback` | GitHub OAuth callback                |
| GET    | `/api/auth/me`              | Get logged-in user profile using JWT |
| POST   | `/api/auth/logout`          | Logout user on client side           |

---

### GitHub Data Endpoints

| Method | Endpoint                    | Description                                               |
| ------ | --------------------------- | --------------------------------------------------------- |
| POST   | `/api/github/sync`          | Sync repositories, commits, and pull requests from GitHub |
| GET    | `/api/github/repos`         | Get synced repositories from PostgreSQL                   |
| GET    | `/api/github/commits`       | Get synced commits from PostgreSQL                        |
| GET    | `/api/github/pull-requests` | Get synced pull requests from PostgreSQL                  |

### Health Check

```http
GET /api/health
```
