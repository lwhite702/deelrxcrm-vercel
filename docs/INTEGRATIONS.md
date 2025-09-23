# Phase 4B Integrations & Operations

This document covers the integration architecture and operational procedures for Phase 4B, focusing on authentication, background jobs, notifications, feature gates, monitoring, and rate limiting.

## Architecture Overview

Phase 4B implements production-ready integrations with:
- **Authentication & Authorization**: Session-based auth with RBAC guards
- **Background Jobs**: Inngest for reliable async processing
- **Notifications**: Knock primary with Resend fallback
- **Feature Gates**: Statsig for controlled feature rollouts
- **Monitoring**: Sentry error tracking with health checks
- **Rate Limiting**: IP and user-based request throttling

## Authentication & Guards

### Session Authentication

The system uses cookie-based session authentication with JWT tokens:

```typescript
// lib/auth/guards.ts
export async function requireAuth(): Promise<AuthContext['user']> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}
```

### RBAC Guards

Tenant-based role guards ensure proper access control:

```typescript
// Require specific role in tenant
const context = await requireTenantRole(teamId, 'owner', 'manager');

// API route with auth
export async function POST(request: NextRequest) {
  return withTenantRole(request, ['owner'], async (context) => {
    // Handler with guaranteed auth context
    return NextResponse.json({ success: true });
  });
}
```

### Supported Roles

- **owner**: Full team administration rights
- **manager**: Team management and configuration
- **staff**: Limited access to assigned features

## Background Jobs (Inngest)

### Job Registry

All background jobs are centralized in `lib/inngest/functions/index.ts`:

```typescript
export * from "./credit";
export * from "./kb"; 
export * from "./admin";
```

### Credit Jobs

#### Daily Reminders (`credit.reminders.daily`)
- **Schedule**: Daily at 9 AM UTC
- **Purpose**: Send payment reminders for overdue accounts
- **Idempotency**: Date-based keys prevent duplicate reminders
- **Actions**: Creates late fees, sends notifications

#### Postdated Charges (`credit.charge.postdated`)
- **Trigger**: Event-driven when scheduled payment is due
- **Purpose**: Process Stripe SetupIntent charges
- **Idempotency**: Unique keys prevent double charging
- **Retry**: 3 attempts with exponential backoff

### Admin Jobs

#### Inactivity Scan (`admin.inactivity.scan`)
- **Schedule**: Daily at 1 AM UTC
- **Purpose**: Detect inactive users based on policies
- **Actions**: Warnings, suspensions, purge scheduling
- **Performance**: Batched processing for large teams

#### Purge Execution (`admin.purge.execute`)
- **Trigger**: Event-driven when purge operation is approved
- **Purpose**: Execute data deletion operations
- **Safety**: Multi-step approval process with export options

### KB Jobs

#### Link Verification (`kb.verify.links`)
- **Schedule**: Weekly on Sundays
- **Purpose**: Check external links in KB articles
- **Actions**: Flag broken links, notify authors
- **Batch Size**: 100 links per batch to avoid rate limits

### Error Handling

All jobs implement comprehensive error handling:

```typescript
try {
  // Job logic
  return { success: true };
} catch (error) {
  // Log error with context
  await inngest.send({
    name: "admin/job.failed",
    data: { jobId, error: error.message }
  });
  throw error; // Let Inngest handle retries
}
```

## Notifications

### Dual Provider Architecture

The notification system uses Knock as primary with Resend fallback:

```typescript
// lib/notifications.ts
export async function notifyCreditDue({ userId, email, payload }) {
  // Try Knock first
  const knockResult = await knockCreditDue({ userId, email, payload });
  if (knockResult.success) return knockResult;
  
  // Fallback to Resend
  return await sendCreditDueEmail({ to: [email], payload });
}
```

### Knock Integration

Knock workflows handle rich notifications with:
- **Multi-channel delivery**: Email, SMS, in-app, push
- **Template management**: Visual editor for non-technical users
- **Delivery tracking**: Read receipts and engagement metrics
- **User preferences**: Per-user notification settings

### Resend Fallback

Resend provides reliable email delivery when Knock fails:
- **Transactional emails**: Credit reminders, admin alerts
- **HTML templates**: Responsive design with urgency styling
- **Bounce handling**: Automatic retry with exponential backoff

### Notification Types

#### Credit Due Notifications
- **Trigger**: Daily credit reminder job
- **Content**: Amount, due date, payment links
- **Urgency**: Color-coded by days overdue
- **Channels**: Email primary, SMS for urgent

#### KB Article Published
- **Trigger**: Article status change to "published"
- **Content**: Article title, author, direct link
- **Audience**: Team members with KB access
- **Channels**: Email notification, in-app badge

#### Admin Alerts
- **Trigger**: System events, errors, policy violations
- **Content**: Alert type, severity, context details
- **Audience**: Team owners and managers
- **Channels**: Email for all, SMS for critical

### Failure Handling

Failed notifications are logged and retried:

```typescript
if (!knockResult.success) {
  // Log failure for monitoring
  await logEvent(user, "notification.fallback_used", "knock_failed");
  
  // Try Resend fallback
  const resendResult = await sendCreditDueEmail({ to: [email], payload });
  
  return {
    success: resendResult.success,
    fallbackUsed: true,
    provider: "resend"
  };
}
```

## Feature Gates (Statsig)

### Client-Side Gates

React components check gates with hooks:

```typescript
import { useGate } from "statsig-react";

function CreditUI() {
  const newUIEnabled = useGate("new_credit_ui");
  
  return newUIEnabled ? <NewCreditUI /> : <LegacyCreditUI />;
}
```

### Server-Side Gates

API routes validate gates before processing:

```typescript
import { checkGate, requireGate } from "@/lib/statsig-server";

export async function POST(request: NextRequest) {
  const user = await requireAuth();
  
  // Require gate or throw error
  await requireGate("admin_purge_controls", createStatsigUser(user));
  
  // Continue with protected functionality
}
```

### Predefined Gates

```typescript
export const FeatureGates = {
  NEW_CREDIT_UI: "new_credit_ui",
  KB_UPLOADS_ENABLED: "kb_uploads_enabled",
  ADMIN_PURGE_CONTROLS: "admin_purge_controls",
  AI_PRICING_ENABLED: "ai_pricing_enabled",
  AI_CREDIT_ENABLED: "ai_credit_enabled",
  AI_DATA_ENABLED: "ai_data_enabled", 
  AI_TRAINING_ENABLED: "ai_training_enabled",
} as const;
```

### Gate Configuration

Gates default to **OFF** in production for safety:
- **Gradual Rollout**: Start with 1% of users, increase slowly
- **Targeting Rules**: Specific users, teams, or roles
- **Metrics Tracking**: Conversion rates and error rates by gate
- **Kill Switch**: Instant disable for problematic features

## Monitoring & Health Checks

### Sentry Integration

Error tracking captures exceptions with context:

```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // Risky operation
  await processPayment(amount);
} catch (error) {
  Sentry.captureException(error, {
    tags: { component: "payment" },
    extra: { amount, userId },
  });
  throw error;
}
```

### Health Check Endpoints

#### Readiness (`/api/_health/ready`)
- **Purpose**: Check if service can handle requests
- **Checks**: Database connectivity, environment variables
- **Response**: 200 OK or 503 Service Unavailable

#### Liveness (`/api/_health/live`)
- **Purpose**: Check if service process is running
- **Checks**: Basic process metrics, memory usage
- **Response**: Always 200 OK if process responds

#### Error Test (`/api/_health/error-test`)
- **Purpose**: Verify Sentry configuration (dev only)
- **Action**: Throws test exception, captures with Sentry
- **Response**: Confirmation of error capture

### Monitoring Strategy

1. **Error Rates**: < 1% error rate for critical paths
2. **Response Times**: P95 < 500ms for API endpoints
3. **Background Jobs**: < 5% failure rate with retry success
4. **Notification Delivery**: > 99% delivery rate (primary + fallback)

## Rate Limiting

### In-Memory Rate Limiter

Simple rate limiting for development and light production use:

```typescript
import { rateLimit, RateLimitConfigs } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const result = await rateLimit(request, RateLimitConfigs.CREDIT_CHARGE);
  
  if (!result.allowed) {
    return new Response("Rate limit exceeded", { status: 429 });
  }
  
  // Continue with request
}
```

### Rate Limit Configurations

- **Stripe Webhooks**: 100 requests/minute (high traffic)
- **Credit Charges**: 10 requests/minute per user (prevent abuse)
- **Refunds**: 5 requests/minute per user (manual verification)
- **Purge Operations**: 3 requests/hour per user (admin safety)
- **File Uploads**: 20 requests/minute per user (reasonable usage)
- **Auth Login**: 5 attempts/15 minutes per IP (brute force protection)

### Production Considerations

For high-traffic production, use Redis-based rate limiting:

```typescript
// With Redis (recommended for production)
const redis = new Redis(process.env.RATE_LIMIT_REDIS_URL);

export async function distributedRateLimit(key: string, limit: number, window: number) {
  const multi = redis.multi();
  multi.incr(key);
  multi.expire(key, window);
  const [count] = await multi.exec();
  
  return { allowed: count <= limit, remaining: limit - count };
}
```

## Environment Variables

### Required Variables

```bash
# Authentication
DATABASE_URL=postgresql://...

# Background Jobs  
INNGEST_SIGNING_KEY=signkey-...
INNGEST_EVENT_KEY=...

# Notifications
KNOCK_API_KEY=sk_test_...
RESEND_API_KEY=re_...

# Feature Gates
STATSIG_SERVER_SECRET_KEY=secret-...
NEXT_PUBLIC_STATSIG_CLIENT_KEY=client-...

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

### Optional Variables

```bash
# Enhanced notifications
NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY=pk_test_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Distributed rate limiting
RATE_LIMIT_REDIS_URL=redis://...
RATE_LIMIT_REDIS_TOKEN=...
```

## Boot Order & Dependencies

### Startup Sequence

1. **Database Connection**: Verify PostgreSQL connectivity
2. **Statsig Initialization**: Load feature gate configuration
3. **Sentry Setup**: Initialize error monitoring
4. **Inngest Registration**: Register background job functions
5. **Rate Limit Store**: Initialize in-memory or Redis store
6. **Health Checks**: Enable monitoring endpoints

### Failure Modes

- **Database Unavailable**: Health checks fail, requests return 503
- **Statsig Down**: Gates default to OFF (fail closed)
- **Knock Unavailable**: Automatic fallback to Resend
- **Resend Down**: Notifications logged for manual retry
- **Inngest Issues**: Jobs queued for retry with exponential backoff

## Operational Procedures

### Feature Gate Rollout

1. **Create Gate**: Define in Statsig dashboard, default OFF
2. **Code Integration**: Add gate checks to relevant components
3. **Deploy**: Code deployed with gate OFF (safe)
4. **Test**: Enable for specific test users
5. **Gradual Rollout**: 1% → 10% → 50% → 100%
6. **Monitor**: Track error rates and metrics
7. **Rollback**: Instant disable if issues detected

### Background Job Monitoring

1. **Success Rates**: Monitor job completion percentages
2. **Retry Patterns**: Alert on excessive retry attempts
3. **Queue Depth**: Watch for job backlog growth
4. **Error Classification**: Categorize failures for targeted fixes

### Notification Debugging

1. **Delivery Tracking**: Check Knock/Resend dashboards
2. **Fallback Usage**: Monitor fallback activation rates
3. **Bounce Rates**: Track email delivery issues
4. **User Preferences**: Respect opt-out settings

### Performance Optimization

1. **Rate Limit Tuning**: Adjust limits based on usage patterns
2. **Cache Strategy**: Cache gate values and user contexts
3. **Database Indexing**: Optimize queries for auth and jobs
4. **Background Job Batching**: Process multiple items per job

This integration architecture provides a robust foundation for production operations with comprehensive monitoring, graceful fallbacks, and operational safety measures.