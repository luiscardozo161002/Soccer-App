import Redis from "ioredis";

// Optional: without REDIS_URL, falls back to an in-memory counter (fine for
// a single local dev process, not for sharing counts across instances).
const redisUrl = process.env.REDIS_URL;
const redis = redisUrl
  ? new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, retryStrategy: () => null })
  : null;

if (redis) {
  // Never let a Redis connection error crash the request path — checkRateLimit
  // already falls back to memory on any failure below.
  redis.on("error", () => {});
}

interface MemoryEntry {
  count: number;
  resetAt: number;
}
const memoryStore = new Map<string, MemoryEntry>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

function checkMemory(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);
  if (!entry || entry.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  entry.count++;
  if (entry.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

// Fixed-window counter. Falls open to memory if Redis is configured but
// unreachable — a rate limiter that blocks /login on a Redis hiccup is worse.
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSeconds);
      if (count > limit) {
        const ttl = await redis.ttl(key);
        return { allowed: false, retryAfterSeconds: ttl > 0 ? ttl : windowSeconds };
      }
      return { allowed: true, retryAfterSeconds: 0 };
    } catch {
      return checkMemory(key, limit, windowSeconds);
    }
  }
  return checkMemory(key, limit, windowSeconds);
}
