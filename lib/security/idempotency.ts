import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_KV_REST_API_URL!,
  token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN!,
});

interface IdempotencyOptions {
  ttl?: number; // TTL in seconds, default 24 hours
  keyPrefix?: string;
}

/**
 * Enforces idempotency for API endpoints using Redis
 */
export class IdempotencyManager {
  private options: Required<IdempotencyOptions>;

  constructor(options: IdempotencyOptions = {}) {
    this.options = {
      ttl: options.ttl || 86400, // 24 hours default
      keyPrefix: options.keyPrefix || 'idempotent',
    };
  }

  /**
   * Check if request is idempotent and store key if not seen before
   */
  async checkAndStore(req: NextRequest): Promise<{ isReplay: boolean; stored?: any }> {
    const idempotencyKey = req.headers.get('idempotency-key');
    
    if (!idempotencyKey) {
      throw new Error('Missing idempotency-key header');
    }

    const redisKey = `${this.options.keyPrefix}:${idempotencyKey}`;
    
    try {
      // Check if key exists
      const existing = await redis.get(redisKey);
      
      if (existing) {
        return { isReplay: true, stored: existing };
      }

      // Store placeholder to reserve the key
      await redis.setex(redisKey, this.options.ttl, { 
        timestamp: Date.now(), 
        status: 'processing',
        method: req.method,
        url: req.url
      });

      return { isReplay: false };
    } catch (error) {
      console.error('Idempotency check failed:', error);
      // Fail closed - treat as duplicate to prevent issues
      throw new Error('Idempotency service unavailable');
    }
  }

  /**
   * Store the response for this idempotency key
   */
  async storeResponse(idempotencyKey: string, response: any): Promise<void> {
    const redisKey = `${this.options.keyPrefix}:${idempotencyKey}`;
    
    try {
      await redis.setex(redisKey, this.options.ttl, {
        timestamp: Date.now(),
        status: 'completed',
        response: response
      });
    } catch (error) {
      console.error('Failed to store idempotent response:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Clean up failed/processing requests (for background cleanup)
   */
  async cleanup(): Promise<void> {
    // Implementation would scan for old processing keys and clean them up
    // For now, rely on TTL to handle cleanup
  }
}

// Default instance
export const idempotency = new IdempotencyManager();

/**
 * Middleware to enforce idempotency on API routes
 */
export function enforceIdempotency(options?: IdempotencyOptions) {
  const manager = new IdempotencyManager(options);
  
  return async (req: NextRequest): Promise<NextResponse | null> => {
    try {
      const result = await manager.checkAndStore(req);
      
      if (result.isReplay) {
        // Return stored response if available
        if (result.stored?.response) {
          return NextResponse.json(result.stored.response, { 
            status: 200,
            headers: { 'X-Idempotency-Replay': 'true' }
          });
        } else {
          // Request is still processing
          return NextResponse.json(
            { error: 'Request is being processed', retryAfter: 5 },
            { 
              status: 409,
              headers: { 'Retry-After': '5' }
            }
          );
        }
      }

      return null; // Allow request to proceed
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Idempotency check failed' },
        { status: 400 }
      );
    }
  };
}

/**
 * Helper to generate idempotency keys
 */
export function generateIdempotencyKey(prefix = 'req'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Sensitive endpoints that require idempotency
 */
export const idempotentEndpoints = [
  '/api/stripe/webhook',
  '/api/teams/*/credit',
  '/api/teams/*/payments',
  '/api/teams/*/orders',
  '/api/admin/purge',
  '/api/help/uploads',
] as const;