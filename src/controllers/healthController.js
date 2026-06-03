const { pool } = require("../config/db");

const getHealthStatus = async (req, res) => {
  try {
    const dbResult = await pool.query("SELECT NOW()");

    res.status(200).json({
      status: "success",
      message: "DevPulse API is running",
      database: {
        status: "connected",
        timestamp: dbResult.rows[0].now,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "DevPulse API is running, but database connection failed",
      database: {
        status: "disconnected",
      },
    });
  }
};

module.exports = {
  getHealthStatus,
};