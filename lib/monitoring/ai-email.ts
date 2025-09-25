import { NextRequest, NextResponse } from 'next/server';
import { eq, and, gte, desc, count, avg, sql } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { aiRequests } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth/jwt';
import { initializeStatsig, FEATURE_GATES } from '@/lib/feature-gates';
import Statsig from 'statsig-node';

/**
 * Health check endpoint for AI email system
 * GET /api/health/ai-email
 */
export async function GET(request: NextRequest) {
  try {
    // Require superAdmin role for health checks
    const payload = await requireRole(request, 'superAdmin');
    
    const healthStatus = {
      timestamp: new Date().toISOString(),
      system: 'ai-email',
      status: 'healthy',
      checks: {} as Record<string, any>,
      metrics: {} as Record<string, any>,
    };

    // Check environment variables
    healthStatus.checks.environment = {
      status: 'healthy',
      details: {
        openaiApiKey: !!process.env.OPENAI_API_KEY,
        jwtSecret: !!process.env.JWT_SECRET,
        statsigKey: !!process.env.STATSIG_SERVER_SECRET_KEY,
        databaseUrl: !!process.env.DATABASE_URL,
      },
    };

    // Check feature gates connectivity
    try {
      await initializeStatsig();
      const testUser = { userID: 'health-check' };
      const gateCheck = await Statsig.checkGate(testUser, FEATURE_GATES.AI_EMAIL_ENABLED);
      
      healthStatus.checks.featureGates = {
        status: 'healthy',
        details: {
          statsigInitialized: true,
          testGateResponse: typeof gateCheck === 'boolean',
        },
      };
    } catch (error) {
      healthStatus.checks.featureGates = {
        status: 'degraded',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      healthStatus.status = 'degraded';
    }

    // Check database connectivity and recent AI request metrics
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentRequests = await db
        .select({
          count: count(),
          successRate: sql<number>`(COUNT(CASE WHEN success = true THEN 1 END) * 100.0 / COUNT(*))`,
          avgDuration: avg(aiRequests.duration),
        })
        .from(aiRequests)
        .where(
          and(
            gte(aiRequests.createdAt, twentyFourHoursAgo),
            eq(aiRequests.providerId, 'vercel-openai-email')
          )
        );

      const featureBreakdown = await db
        .select({
          feature: aiRequests.feature,
          count: count(),
          successRate: sql<number>`(COUNT(CASE WHEN success = true THEN 1 END) * 100.0 / COUNT(*))`,
        })
        .from(aiRequests)
        .where(
          and(
            gte(aiRequests.createdAt, twentyFourHoursAgo),
            eq(aiRequests.providerId, 'vercel-openai-email')
          )
        )
        .groupBy(aiRequests.feature);

      healthStatus.checks.database = {
        status: 'healthy',
        details: {
          connected: true,
          queryExecuted: true,
        },
      };

      healthStatus.metrics = {
        last24Hours: {
          totalRequests: recentRequests[0]?.count || 0,
          successRate: Number(recentRequests[0]?.successRate || 0),
          avgDuration: Number(recentRequests[0]?.avgDuration || 0),
          featureBreakdown: featureBreakdown.reduce((acc, item) => {
            acc[item.feature || 'unknown'] = {
              count: item.count,
              successRate: Number(item.successRate),
            };
            return acc;
          }, {} as Record<string, any>),
        },
      };

    } catch (error) {
      healthStatus.checks.database = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Database error',
      };
      healthStatus.status = 'unhealthy';
    }

    // Overall system status
    const allChecksHealthy = Object.values(healthStatus.checks).every(
      check => check.status === 'healthy'
    );
    const someChecksDegraded = Object.values(healthStatus.checks).some(
      check => check.status === 'degraded'
    );

    if (!allChecksHealthy) {
      healthStatus.status = someChecksDegraded ? 'degraded' : 'unhealthy';
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, { status: statusCode });

  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      system: 'ai-email',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 });
  }
}

/**
 * AI Email system metrics endpoint
 * GET /api/admin/email/metrics
 */
export async function getEmailAiMetrics(request: NextRequest) {
  try {
    await requireRole(request, 'superAdmin');

    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '24h';
    const feature = url.searchParams.get('feature');

    // Calculate time range
    const now = new Date();
    let startTime: Date;
    
    switch (timeframe) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Build base query conditions
    const conditions = [
      gte(aiRequests.createdAt, startTime),
      eq(aiRequests.providerId, 'vercel-openai-email'),
    ];

    if (feature) {
      conditions.push(eq(aiRequests.feature, feature));
    }

    // Overall metrics
    const overallMetrics = await db
      .select({
        totalRequests: count(),
        successfulRequests: sql<number>`COUNT(CASE WHEN success = true THEN 1 END)`,
        failedRequests: sql<number>`COUNT(CASE WHEN success = false THEN 1 END)`,
        avgDuration: avg(aiRequests.duration),
        minDuration: sql<number>`MIN(duration)`,
        maxDuration: sql<number>`MAX(duration)`,
      })
      .from(aiRequests)
      .where(and(...conditions));

    // Feature breakdown
    const featureMetrics = await db
      .select({
        feature: aiRequests.feature,
        totalRequests: count(),
        successfulRequests: sql<number>`COUNT(CASE WHEN success = true THEN 1 END)`,
        failedRequests: sql<number>`COUNT(CASE WHEN success = false THEN 1 END)`,
        avgDuration: avg(aiRequests.duration),
      })
      .from(aiRequests)
      .where(and(...conditions))
      .groupBy(aiRequests.feature)
      .orderBy(desc(count()));

    // Model performance
    const modelMetrics = await db
      .select({
        model: aiRequests.model,
        totalRequests: count(),
        successRate: sql<number>`(COUNT(CASE WHEN success = true THEN 1 END) * 100.0 / COUNT(*))`,
        avgDuration: avg(aiRequests.duration),
      })
      .from(aiRequests)
      .where(and(...conditions))
      .groupBy(aiRequests.model)
      .orderBy(desc(count()));

    // Recent errors
    const recentErrors = await db
      .select({
        id: aiRequests.id,
        feature: aiRequests.feature,
        model: aiRequests.model,
        error: aiRequests.error,
        createdAt: aiRequests.createdAt,
        teamId: aiRequests.teamId,
        userId: aiRequests.userId,
      })
      .from(aiRequests)
      .where(
        and(
          ...conditions,
          eq(aiRequests.success, false)
        )
      )
      .orderBy(desc(aiRequests.createdAt))
      .limit(20);

    // Time series data (hourly buckets)
    const timeSeriesData = await db
      .select({
        hour: sql<string>`DATE_TRUNC('hour', created_at)`,
        totalRequests: count(),
        successfulRequests: sql<number>`COUNT(CASE WHEN success = true THEN 1 END)`,
        avgDuration: avg(aiRequests.duration),
      })
      .from(aiRequests)
      .where(and(...conditions))
      .groupBy(sql`DATE_TRUNC('hour', created_at)`)
      .orderBy(sql`DATE_TRUNC('hour', created_at)`);

    const overall = overallMetrics[0];
    const successRate = overall.totalRequests > 0 
      ? (Number(overall.successfulRequests) / Number(overall.totalRequests)) * 100 
      : 0;

    return NextResponse.json({
      timeframe,
      period: {
        start: startTime.toISOString(),
        end: now.toISOString(),
      },
      overview: {
        totalRequests: Number(overall.totalRequests),
        successfulRequests: Number(overall.successfulRequests),
        failedRequests: Number(overall.failedRequests),
        successRate: Number(successRate.toFixed(2)),
        avgDuration: Number((typeof overall.avgDuration === 'number' ? overall.avgDuration : 0).toFixed(2)),
        minDuration: Number(overall.minDuration || 0),
        maxDuration: Number(overall.maxDuration || 0),
      },
      features: featureMetrics.map(feature => ({
        name: feature.feature,
        totalRequests: Number(feature.totalRequests),
        successfulRequests: Number(feature.successfulRequests),
        failedRequests: Number(feature.failedRequests),
        successRate: Number(
          ((Number(feature.successfulRequests) / Number(feature.totalRequests)) * 100).toFixed(2)
        ),
        avgDuration: Number((typeof feature.avgDuration === 'number' ? feature.avgDuration : 0).toFixed(2)),
      })),
      models: modelMetrics.map(model => ({
        name: model.model,
        totalRequests: Number(model.totalRequests),
        successRate: Number(Number(model.successRate).toFixed(2)),
        avgDuration: Number((typeof model.avgDuration === 'number' ? model.avgDuration : 0).toFixed(2)),
      })),
      recentErrors: recentErrors.map(error => ({
        id: error.id,
        feature: error.feature,
        model: error.model,
        error: error.error,
        timestamp: error.createdAt.toISOString(),
        teamId: error.teamId,
        userId: error.userId,
      })),
      timeSeries: timeSeriesData.map(point => ({
        timestamp: point.hour,
        totalRequests: Number(point.totalRequests),
        successfulRequests: Number(point.successfulRequests),
        avgDuration: Number((typeof point.avgDuration === 'number' ? point.avgDuration : 0).toFixed(2)),
      })),
    });

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Utility function to get AI email system status
 */
export async function getAiEmailSystemStatus(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: Record<string, any>;
}> {
  const status: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  } = {
    status: 'healthy',
    details: {},
  };

  // Check environment configuration
  const envCheck = {
    openaiApiKey: !!process.env.OPENAI_API_KEY,
    jwtSecret: !!process.env.JWT_SECRET,
    statsigKey: !!process.env.STATSIG_SERVER_SECRET_KEY,
    databaseUrl: !!process.env.DATABASE_URL,
  };

  status.details.environment = envCheck;

  if (!Object.values(envCheck).every(Boolean)) {
    status.status = 'unhealthy';
    status.details.environmentIssues = Object.entries(envCheck)
      .filter(([_, value]) => !value)
      .map(([key]) => `Missing ${key}`);
  }

  // Check feature gates
  try {
    await initializeStatsig();
    const testUser = { userID: 'system-check' };
    await Statsig.checkGate(testUser, FEATURE_GATES.AI_EMAIL_ENABLED);
    status.details.featureGates = { status: 'connected' };
  } catch (error) {
    status.status = status.status === 'healthy' ? 'degraded' : status.status;
    status.details.featureGates = { 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // Check recent performance
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequests = await db
      .select({
        count: count(),
        successRate: sql<number>`(COUNT(CASE WHEN success = true THEN 1 END) * 100.0 / COUNT(*))`,
      })
      .from(aiRequests)
      .where(
        and(
          gte(aiRequests.createdAt, oneHourAgo),
          eq(aiRequests.providerId, 'vercel-openai-email')
        )
      );

    const metrics = recentRequests[0];
    const successRate = Number(metrics?.successRate || 0);

    status.details.recentPerformance = {
      requestCount: Number(metrics?.count || 0),
      successRate,
    };

    if (successRate < 90 && Number(metrics?.count || 0) > 5) {
      status.status = status.status === 'healthy' ? 'degraded' : status.status;
      status.details.performanceIssue = `Success rate is ${successRate.toFixed(1)}%`;
    }

  } catch (error) {
    status.status = status.status === 'healthy' ? 'degraded' : status.status;
    status.details.database = { 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Database error'
    };
  }

  return status;
}

/**
 * Performance monitoring utilities
 */
export class EmailAiMonitor {
  private static instance: EmailAiMonitor;

  private constructor() {}

  static getInstance(): EmailAiMonitor {
    if (!EmailAiMonitor.instance) {
      EmailAiMonitor.instance = new EmailAiMonitor();
    }
    return EmailAiMonitor.instance;
  }

  async trackRequest(
    feature: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>
  ): Promise<void> {
    // This could be extended to send metrics to external monitoring services
    // like DataDog, New Relic, or custom analytics platforms
    
    const metrics = {
      timestamp: new Date().toISOString(),
      feature,
      duration,
      success,
      metadata,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('AI Email Request Metrics:', metrics);
    }

    // In production, you might want to send to external services:
    // await this.sendToDatadog(metrics);
    // await this.sendToNewRelic(metrics);
  }

  async getHealthScore(): Promise<number> {
    try {
      const status = await getAiEmailSystemStatus();
      
      switch (status.status) {
        case 'healthy':
          return 1.0;
        case 'degraded':
          return 0.7;
        case 'unhealthy':
          return 0.3;
        default:
          return 0.0;
      }
    } catch {
      return 0.0;
    }
  }

  async alertOnFailures(
    threshold: number = 5,
    timeWindowMinutes: number = 15
  ): Promise<void> {
    try {
      const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
      
      const recentFailures = await db
        .select({ count: count() })
        .from(aiRequests)
        .where(
          and(
            gte(aiRequests.createdAt, timeWindow),
            eq(aiRequests.success, false),
            eq(aiRequests.providerId, 'vercel-openai-email')
          )
        );

      const failureCount = Number(recentFailures[0]?.count || 0);

      if (failureCount >= threshold) {
        console.error(`AI Email Alert: ${failureCount} failures in ${timeWindowMinutes} minutes`);
        
        // In production, you might want to:
        // await this.sendSlackAlert(`AI Email system has ${failureCount} failures`);
        // await this.sendPagerDutyAlert('ai-email-failures', failureCount);
        // await this.sendEmailAlert('devops@company.com', 'AI Email System Alert');
      }
    } catch (error) {
      console.error('Failed to check for AI email failures:', error);
    }
  }
}

// Export singleton instance
export const emailAiMonitor = EmailAiMonitor.getInstance();