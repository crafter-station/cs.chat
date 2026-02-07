import { redis } from "./ratelimit";

export const TIER_LIMITS: Record<string, number | null> = {
  anonymous: 5,
  free: 50,
  paid: null, // unlimited
};

function getDailyKey(userId: string): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  return `daily_msgs:${userId}:${date}`;
}

function secondsUntilMidnightUTC(): number {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return Math.ceil((tomorrow.getTime() - now.getTime()) / 1000);
}

export async function getUsage(
  userId: string,
  tier: string
): Promise<{ used: number; limit: number | null; remaining: number | null; canSend: boolean }> {
  const limit = TIER_LIMITS[tier] ?? null;
  if (limit === null) return { used: 0, limit: null, remaining: null, canSend: true };
  if (!redis) return { used: 0, limit, remaining: limit, canSend: true };

  const key = getDailyKey(userId);
  const used = (await redis.get<number>(key)) ?? 0;
  const remaining = Math.max(0, limit - used);
  return { used, limit, remaining, canSend: used < limit };
}

export async function incrementUsage(
  userId: string,
  tier: string
): Promise<boolean> {
  const limit = TIER_LIMITS[tier] ?? null;
  if (limit === null) return true; // unlimited
  if (!redis) return true; // no redis = no enforcement

  const key = getDailyKey(userId);
  const current = (await redis.get<number>(key)) ?? 0;
  if (current >= limit) return false;

  const pipeline = redis.pipeline();
  pipeline.incr(key);
  pipeline.expire(key, secondsUntilMidnightUTC());
  await pipeline.exec();
  return true;
}
