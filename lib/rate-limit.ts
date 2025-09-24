import { NextRequest } from "next/server";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (request: NextRequest) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory fallback store for development or when Redis is not available
// Redis is used for distributed rate limiting in production (see getRedisClient())
const rateLimitStore = new Map<string, RateLimitEntry>();

// Redis client (lazy loaded)
let redis: any = null;
let redisInitialized = false;

async function getRedisClient() {
  if (!redisInitialized) {
    redisInitialized = true;
    // Use Redis when configured (production or development with explicit config)
    const redisUrl = process.env.UPSTASH_REDIS_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (redisUrl && redisToken) {
      try {
        const { Redis } = await import('@upstash/redis');
        redis = new Redis({
          url: redisUrl,
          token: redisToken,
        });
        // Test the connection
        await redis.ping();
        console.log('Rate limiting using Redis (distributed)');
      } catch (error) {
        console.warn('Failed to initialize Redis for rate limiting, falling back to in-memory:', error);
        redis = null;
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.warn('Redis not configured for production rate limiting, using in-memory (not recommended for scaled deployments)');
    }
  }
  return redis;
}

/**
 * Distributed rate limiter with Redis support and in-memory fallback
 * Uses Redis in production for distributed rate limiting across instances
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<{ allowed: boolean; limit: number; remaining: number; resetTime: number }> {
  const key = config.keyGenerator ? config.keyGenerator(request) : getDefaultKey(request);
  const redisClient = await getRedisClient();
  
  if (redisClient) {
    return await distributedRateLimit(redisClient, key, config);
  } else {
    return await inMemoryRateLimit(key, config);
  }
}

/**
 * Redis-based distributed rate limiting
 */
async function distributedRateLimit(
  redis: any,
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; limit: number; remaining: number; resetTime: number }> {
  try {
    const redisKey = `rl:${key}`;
    const windowSeconds = Math.ceil(config.windowMs / 1000);
    const now = Date.now();
    const resetTime = now + config.windowMs;

    // Use Redis pipeline for atomic operations
    const pipeline = redis.multi();
    pipeline.incr(redisKey);
    pipeline.expire(redisKey, windowSeconds);
    
    const results = await pipeline.exec();
    const count = results[0] || 0;
    
    const allowed = count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - count);

    return {
      allowed,
      limit: config.maxRequests,
      remaining,
      resetTime,
    };
  } catch (error) {
    console.error('Redis rate limiting failed, falling back to in-memory:', error);
    // Fall back to in-memory on Redis errors
    return await inMemoryRateLimit(key, config);
  }
}

/**
 * In-memory rate limiting (fallback)
 */
async function inMemoryRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; limit: number; remaining: number; resetTime: number }> {
  const now = Date.now();
  
  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance to cleanup
    cleanupExpiredEntries(now);
  }

  let entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired one
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  entry.count++;
  rateLimitStore.set(key, entry);

  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    allowed,
    limit: config.maxRequests,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Get default rate limit key (IP + User ID if available)
 */
function getDefaultKey(request: NextRequest): string {
  const ip = getClientIP(request);
  const userId = request.headers.get("x-user-id") || "anonymous";
  return `${ip}:${userId}`;
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return "unknown";
}

/**
 * Clean up expired entries from memory
 */
function cleanupExpiredEntries(now: number) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitConfigs = {
  // Strict limits for sensitive operations
  STRIPE_WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
  
  CREDIT_CHARGE: {
    windowMs: 60 * 1000, // 1 minute  
    maxRequests: 10, // 10 charges per minute per user
  },
  
  REFUNDS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 refunds per minute per user
  },
  
  PURGE_OPERATIONS: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 purge operations per hour per user
  },
  
  FILE_UPLOADS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 uploads per minute per user
  },
  
  // Generous limits for regular API usage
  API_GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000, // 1000 requests per minute per user
  },
  
  // Very strict for auth endpoints
  AUTH_LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes per IP
    keyGenerator: (request: NextRequest) => getClientIP(request), // Only by IP
  },
} as const;

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit(config: RateLimitConfig) {
  return async function(request: NextRequest, handler: () => Promise<Response>): Promise<Response> {
    const result = await rateLimit(request, config);
    
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          limit: result.limit,
          remaining: result.remaining,
          resetTime: result.resetTime,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": result.limit.toString(),
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": result.resetTime.toString(),
            "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const response = await handler();
    
    // Add rate limit headers to successful responses
    response.headers.set("X-RateLimit-Limit", result.limit.toString());
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", result.resetTime.toString());
    
    return response;
  };
}