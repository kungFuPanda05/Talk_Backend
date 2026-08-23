import 'dotenv/config';
import Redis from "ioredis";

const isEnabled = (value) => String(value).toLowerCase() === 'true';

export const redisEnabled = isEnabled(process.env.REDIS_ENABLED)
  || isEnabled(process.env.CONNECT_BOT)
  || isEnabled(process.env.CHAT_CONTEXT_TRIE_UPDATE);

const redisPort = Number.parseInt(process.env.REDIS_PORT || '6379', 10);
const commonRedisOptions = {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 100, 3000),
};

const createRedisClient = () => {
  if (!redisEnabled) return null;

  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, commonRedisOptions);
  }

  return new Redis({
    ...commonRedisOptions,
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number.isFinite(redisPort) ? redisPort : 6379,
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    tls: isEnabled(process.env.REDIS_TLS) ? {} : undefined,
  });
};

export const redisClient = createRedisClient();

if (redisClient) {
  redisClient.on("error", (err) => {
    console.error("Redis connection error:", err.message);
  });

  redisClient.ping()
    .then(() => console.log("Redis connected successfully"))
    .catch((err) => console.error("Unable to connect to Redis:", err.message));
}

// ────────────────────────────────────────────────────────────────────────────────
// 🔹 Utility Functions for Redis
// ────────────────────────────────────────────────────────────────────────────────

// ✅ Set data in Redis with optional expiration
export const setData = async (key, value, expiry = 24*60*60) => {
  if (!redisClient) return false;

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
  if (!redisClient) return null;

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
  if (!redisClient) return false;

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
  if (!redisClient) return false;

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
  if (!redisClient) return [];

  try {
    return await redisClient.keys(pattern);
  } catch (error) {
    console.error(`❌ Error fetching keys with pattern "${pattern}":`, error);
    return [];
  }
};

// ✅ Flush all keys (Use with caution!)
export const flushAll = async () => {
  if (!redisClient) return false;

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

export const closeRedis = async () => {
  if (!redisClient || redisClient.status === 'end') return;
  await redisClient.quit();
};

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
