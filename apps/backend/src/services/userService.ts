import { prisma } from 'db';
import { getRedis } from 'db/redis';

export async function getUserByEmail(email: string) {
  const redis = getRedis();
  // Try Redis cache first
  const cached = await redis.get(`user:${email}`);
  if (cached) return JSON.parse(cached);

  // Fallback to DB
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) await redis.set(`user:${email}`, JSON.stringify(user));
  return user;
}
