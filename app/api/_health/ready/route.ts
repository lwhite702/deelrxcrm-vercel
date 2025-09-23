import { NextRequest, NextResponse } from "next/server";

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
    if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 64) {
      missingEnvVars.push("ENCRYPTION_KEY (invalid format - must be 64 hex chars)");
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