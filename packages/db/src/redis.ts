import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    redis.on('connect', () => console.log('[Redis] Connected'));
    redis.on('error', (err) => console.error('[Redis] Error:', err));
    redis.on('close', () => console.log('[Redis] Connection closed'));
  }
  return redis;
}

export async function disconnectRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('[Redis] Disconnected gracefully');
  }
}
