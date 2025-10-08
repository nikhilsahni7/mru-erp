import Redis from "ioredis";

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  return null;
};

// Create Redis client only if URL is provided
let redisClient: Redis | null = null;

const redisUrl = getRedisUrl();
if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      retryStrategy: (times) => {
        if (times > 3) {
          console.log(
            "[Redis] Max retry attempts reached. Redis will be disabled."
          );
          return null; // Stop retrying
        }
        return Math.min(times * 1000, 3000);
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    // Connect with error handling
    redisClient.connect().catch((err) => {
      console.warn("[Redis] Failed to connect:", err.message);
      console.log("[Redis] Application will continue without Redis");
      redisClient = null;
    });

    redisClient.on("error", (err) => {
      console.warn("[Redis] Connection error:", err.message);
    });

    redisClient.on("connect", () => {
      console.log("[Redis] Connected successfully");
    });
  } catch (error) {
    console.warn("[Redis] Failed to initialize:", error);
    redisClient = null;
  }
} else {
  console.log("[Redis] REDIS_URL not provided. Running without Redis.");
}

export const redis = redisClient;

export const disconnectRedis = async () => {
  if (redis) {
    try {
      await redis.quit();
      console.log("[Redis] Disconnected successfully");
    } catch (error) {
      console.warn("[Redis] Error during disconnect:", error);
    }
  }
};
