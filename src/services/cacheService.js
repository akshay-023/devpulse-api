const { redisClient } = require("../config/redis");

const DEFAULT_TTL_SECONDS = 900; // 15 minutes

const getCache = async (key) => {
  try {
    if (!redisClient.isOpen) {
      return null;
    }

    const cachedData = await redisClient.get(key);

    if (!cachedData) {
      console.log(`Cache MISS: ${key}`);
      return null;
    }

    console.log(`Cache HIT: ${key}`);
    return JSON.parse(cachedData);
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error.message);
    return null;
  }
};

const setCache = async (key, data, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  try {
    if (!redisClient.isOpen) {
      return;
    }

    await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
    console.log(`Cache SET: ${key} (${ttlSeconds}s)`);
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error.message);
  }
};

const deleteCache = async (key) => {
  try {
    if (!redisClient.isOpen) {
      return;
    }

    await redisClient.del(key);
    console.log(`Cache DELETE: ${key}`);
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error.message);
  }
};

const deleteCacheByPattern = async (pattern) => {
  try {
    if (!redisClient.isOpen) {
      return;
    }

    const keys = await redisClient.keys(pattern);

    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Cache DELETE pattern: ${pattern}, keys deleted: ${keys.length}`);
    }
  } catch (error) {
    console.error(`Cache pattern delete error for pattern ${pattern}:`, error.message);
  }
};

const buildUserCacheKey = (userId, resource) => {
  return `user:${userId}:${resource}`;
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  deleteCacheByPattern,
  buildUserCacheKey,
};