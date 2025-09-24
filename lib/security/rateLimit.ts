import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Redis client with fallback for environment variable naming
let redis: Redis | null = null;

try {
  const redisUrl = process.env.UPSTASH_REDIS_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (redisUrl && redisToken) {
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  }
} catch (error) {
  console.warn('Failed to initialize Redis for rate limiting:', error);
}

interface RateLimitConfig {
  key: string;
  limit: number;
  window: number; // seconds
  skipSuccessfulRequests?: boolean;
}

export class RateLimiter {
  public readonly config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async check(req: NextRequest): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const identifier = this.getIdentifier(req);
    const redisKey = `rl:${this.config.key}:${identifier}`;
    
    // If Redis is not available, fail open (allow requests)
    if (!redis) {
      console.warn('Redis not available for rate limiting, allowing request');
      return { 
        allowed: true, 
        remaining: this.config.limit, 
        resetTime: Date.now() + (this.config.window * 1000) 
      };
    }
    
    try {
      const current = await redis.get<number>(redisKey) || 0;
      const remaining = Math.max(0, this.config.limit - current - 1);
      const resetTime = Date.now() + (this.config.window * 1000);

      if (current >= this.config.limit) {
        return { allowed: false, remaining: 0, resetTime };
      }

      // Increment counter
      const multi = redis.multi();
      multi.incr(redisKey);
      multi.expire(redisKey, this.config.window);
      await multi.exec();

      return { allowed: true, remaining, resetTime };
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow request if Redis is down
      return { allowed: true, remaining: this.config.limit, resetTime: Date.now() };
    }
  }

  private getIdentifier(req: NextRequest): string {
    // Use IP + user ID if available
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userId = req.headers.get('x-user-id') || '';
    return `${ip}:${userId}`;
  }
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  webhook: new RateLimiter({ key: 'webhook', limit: 100, window: 60 }),
  upload: new RateLimiter({ key: 'upload', limit: 10, window: 60 }),
  auth: new RateLimiter({ key: 'auth', limit: 5, window: 60 }),
  api: new RateLimiter({ key: 'api', limit: 1000, window: 60 }),
  admin: new RateLimiter({ key: 'admin', limit: 50, window: 60 }),
};

export async function applyRateLimit(
  req: NextRequest,
  limiter: RateLimiter
): Promise<NextResponse | null> {
  const result = await limiter.check(req);
  
  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000) },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limiter.config.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
        }
      }
    );
  }

  return null; // Allow request to continue
}