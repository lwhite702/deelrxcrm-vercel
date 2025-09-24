import { NextRequest, NextResponse } from "next/server";

/**
 * Perform a health check for the application, verifying database and Redis connectivity,
 * as well as the presence and validity of required environment variables.
 *
 * The function first checks the database connection by executing a simple query.
 * If Redis is configured, it attempts to ping the Redis server. It then checks for
 * the presence of essential environment variables and validates the format of the
 * encryption key. If any checks fail, it returns a JSON response indicating the
 * health status as "unhealthy" along with relevant error information.
 * If all checks pass, it returns a "healthy" status with additional metadata.
 *
 * @param request - The incoming NextRequest object.
 * @returns A JSON response indicating the health status of the application.
 * @throws Error If an unexpected error occurs during the health check process.
 */
export async function GET(request: NextRequest) {
  try {
    // Check database connectivity
    const { db } = await import("@/lib/db/drizzle");
    await db.execute("SELECT 1");

    // Check Redis connectivity (if configured)
    let redisHealthy = true;
    if (process.env.UPSTASH_REDIS_KV_REST_API_URL && process.env.UPSTASH_REDIS_KV_REST_API_TOKEN) {
      try {
        const { Redis } = await import('@upstash/redis');
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_KV_REST_API_URL,
          token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN,
        });
        await redis.ping();
      } catch (error) {
        redisHealthy = false;
        console.error('Redis health check failed:', error);
      }
    }

    // Check environment variables
    const requiredEnvVars = [
      "DATABASE_URL",
      "AUTH_SECRET",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "ENCRYPTION_KEY",
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    // Check encryption key format
    if (process.env.ENCRYPTION_KEY) {
      const key = process.env.ENCRYPTION_KEY;
      if (key.length !== 64) {
        missingEnvVars.push("ENCRYPTION_KEY (invalid format - must be 64 hex chars)");
      } else if (!/^[0-9a-fA-F]+$/.test(key)) {
        missingEnvVars.push("ENCRYPTION_KEY (invalid format - must be valid hex characters)");
      }
    }

    if (missingEnvVars.length > 0 || !redisHealthy) {
      return NextResponse.json(
        {
          status: "unhealthy",
          error: missingEnvVars.length > 0 ? "Missing environment variables" : "Redis connectivity failed",
          missing: missingEnvVars.length > 0 ? missingEnvVars : undefined,
          redis: redisHealthy ? "healthy" : "unhealthy",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "unknown",
      environment: process.env.NODE_ENV,
      redis: redisHealthy ? "healthy" : "not_configured",
      security: {
        encryption: "configured",
        rateLimit: process.env.UPSTASH_REDIS_KV_REST_API_URL ? "enabled" : "disabled",
        statsig: process.env.STATSIG_SERVER_SECRET_KEY ? "enabled" : "disabled",
        sentry: process.env.NEXT_PUBLIC_SENTRY_DSN ? "enabled" : "disabled"
      }
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}