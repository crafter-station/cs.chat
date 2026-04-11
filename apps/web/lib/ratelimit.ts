import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const chatLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      prefix: "ratelimit:chat",
    })
  : null;

const titleLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 s"),
      prefix: "ratelimit:title",
    })
  : null;

const limiters = {
  chat: chatLimiter,
  title: titleLimiter,
} as const;

export type RateLimitType = keyof typeof limiters;

export function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() ?? "anonymous";
}

export async function ratelimit(
  identifier: string,
  type: RateLimitType = "chat",
): Promise<{ success: boolean; response?: Response }> {
  const limiter = limiters[type];
  if (!limiter) return { success: true };

  const result = await limiter.limit(identifier);

  if (!result.success) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: "Too many requests. Please slow down." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": result.limit.toString(),
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": result.reset.toString(),
          },
        },
      ),
    };
  }

  return { success: true };
}
