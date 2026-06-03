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

## Current API Endpoints

### Health Check

```http
GET /api/health