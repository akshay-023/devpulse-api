const { pool } = require("../config/db");
const { redisClient } = require("../config/redis");

const getHealthStatus = async (req, res) => {
  const health = {
    status: "success",
    message: "DevPulse API is running",
    database: {
      status: "unknown",
    },
    cache: {
      status: "unknown",
    },
  };

  try {
    const dbResult = await pool.query("SELECT NOW()");

    health.database = {
      status: "connected",
      timestamp: dbResult.rows[0].now,
    };
  } catch (error) {
    health.status = "error";
    health.database = {
      status: "disconnected",
      error: error.message,
    };
  }

  try {
    if (redisClient.isOpen) {
      await redisClient.ping();

      health.cache = {
        status: "connected",
        provider: "Redis",
      };
    } else {
      health.cache = {
        status: "disconnected",
        provider: "Redis",
      };
    }
  } catch (error) {
    health.status = "error";
    health.cache = {
      status: "disconnected",
      provider: "Redis",
      error: error.message,
    };
  }

  const statusCode = health.status === "success" ? 200 : 500;

  res.status(statusCode).json(health);
};

module.exports = {
  getHealthStatus,
};