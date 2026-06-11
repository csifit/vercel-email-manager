import { kv } from '@vercel/kv';

export interface RateLimitConfig {
  windowMs: number; // milliseconds
  maxRequests: number; // max requests per window
}

const defaultConfig: RateLimitConfig = {
  windowMs: 3600 * 1000, // 1 hour
  maxRequests: 10,
};

/**
 * Check if user has exceeded rate limit
 * @returns true if within limit, false if exceeded
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = defaultConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const key = `ratelimit:${identifier}`;
  
  try {
    const count = await kv.incr(key);

    if (count === 1) {
      // First request in window, set expiration
      await kv.expire(key, Math.ceil(config.windowMs / 1000));
    }

    const remaining = Math.max(0, config.maxRequests - count);
    const ttl = await kv.ttl(key);
    const resetAt = new Date(Date.now() + ttl * 1000);

    return {
      allowed: count <= config.maxRequests,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // If KV fails, allow the request (fail open)
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(),
    };
  }
}

/**
 * Get remaining requests for identifier
 */
export async function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig = defaultConfig
): Promise<{ used: number; remaining: number; resetAt: Date }> {
  const key = `ratelimit:${identifier}`;
  
  try {
    const count = await kv.get<number>(key);
    const ttl = await kv.ttl(key);
    
    const currentCount = count || 0;
    const remaining = Math.max(0, config.maxRequests - currentCount);
    const resetAt = new Date(Date.now() + Math.max(0, ttl) * 1000);

    return {
      used: currentCount,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error('Rate limit status error:', error);
    return {
      used: 0,
      remaining: config.maxRequests,
      resetAt: new Date(),
    };
  }
}

/**
 * Reset rate limit for identifier (admin only)
 */
export async function resetRateLimit(identifier: string): Promise<boolean> {
  try {
    await kv.del(`ratelimit:${identifier}`);
    return true;
  } catch (error) {
    console.error('Rate limit reset error:', error);
    return false;
  }
}