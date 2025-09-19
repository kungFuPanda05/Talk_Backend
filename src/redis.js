import Redis from "ioredis";

// Initialize Redis client
export const redisClient = new Redis({
  host: "127.0.0.1", // Adjust if needed
  port: 6379,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 100, 3000), // Exponential backoff
});

// Event listeners for error handling
redisClient.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

redisClient.ping()
  .then(() => console.log("✅ Redis connected successfully"))
  .catch((err) => console.error("❌ Error connecting to Redis:", err));

// ────────────────────────────────────────────────────────────────────────────────
// 🔹 Utility Functions for Redis
// ────────────────────────────────────────────────────────────────────────────────

// ✅ Set data in Redis with optional expiration
export const setData = async (key, value, expiry = 24*60*60) => {
  try {
    const stringValue = typeof value === "object" ? JSON.stringify(value) : value;
    if (expiry) {
      await redisClient.setex(key, expiry, stringValue);
    } else {
      await redisClient.set(key, stringValue);
    }
    return true;
  } catch (error) {
    console.error(`❌ Error setting key "${key}":`, error);
    return false;
  }
};

// ✅ Get data from Redis
export const getData = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`❌ Error getting key "${key}":`, error);
    return null;
  }
};

// ✅ Delete a key from Redis
export const deleteKey = async (key) => {
  try {
    const result = await redisClient.del(key);
    return result > 0;
  } catch (error) {
    console.error(`❌ Error deleting key "${key}":`, error);
    return false;
  }
};

// ✅ Check if a key exists in Redis
export const isKeyExists = async (key) => {
  try {
    const result = await redisClient.exists(key);
    return result === 1;
  } catch (error) {
    console.error(`❌ Error checking key "${key}":`, error);
    return false;
  }
};

// ✅ Get all keys matching a pattern
export const getKeys = async (pattern = "*") => {
  try {
    return await redisClient.keys(pattern);
  } catch (error) {
    console.error(`❌ Error fetching keys with pattern "${pattern}":`, error);
    return [];
  }
};

// ✅ Flush all keys (Use with caution!)
export const flushAll = async () => {
  try {
    await redisClient.flushall();
    console.warn("⚠️ Redis database flushed!");
    return true;
  } catch (error) {
    console.error("❌ Error flushing Redis database:", error);
    return false;
  }
};

export const wrapper = async(key, cb, ttl) => {
  let data = await getData(key);
  if (data===null || data===undefined) {
    data = await cb();
    await setData(key, data, ttl);
  }
  return data;
}

// Export all functions
export default {
  setData,
  getData,
  deleteKey,
  isKeyExists,
  getKeys,
  flushAll,
  wrapper
};
