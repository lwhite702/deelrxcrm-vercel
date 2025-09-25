# Email System Documentation

## Overview

The DeelRx CRM email system provides secure, AI-enhanced email functionality with robust JWT authentication, comprehensive safety controls, and feature flag protection. The system is designed for enterprise-grade security while enabling powerful AI-assisted email composition and optimization.

## Architecture

### JWT Authentication Model

The email system uses a multi-layered security approach:

1. **JWT Token Verification**: All email admin endpoints require valid JWT tokens
2. **Role-Based Access Control**: SuperAdmin role required for `/dashboard/admin/email/*` and `/api/admin/email/*`
3. **Middleware Protection**: Automatic token validation and role enforcement
4. **Error Handling**: Proper error responses with security-appropriate messages

#### JWT Implementation Details

- **Library**: `jose` for modern, secure JWT handling
- **Token Sources**: 
  - `auth_token` cookie (primary)
  - `Authorization: Bearer <token>` header (fallback)
- **Verification**: Cryptographic signature validation with environment-specific secrets
- **Role Hierarchy**: `user` < `admin` < `superAdmin`

```typescript
// Example JWT payload structure
interface AppJwtPayload {
  sub: string;          // User ID
  role?: AppJwtRole;    // User role
  iat?: number;         // Issued at
  exp?: number;         // Expires at
  iss?: string;         // Issuer
  aud?: string;         // Audience
}
```

### AI Helpers Integration

The email AI system provides four core capabilities:

1. **Subject Generation** (`generateEmailSubject`)
2. **Body Composition** (`generateEmailBody`)
3. **Template Optimization** (`optimizeEmailTemplate`)
4. **Personalization** (`generatePersonalizedEmail`)

#### Safety Controls

All AI functions include comprehensive safety measures:

- **Content Filtering**: Prohibited pattern detection
- **Safety Scoring**: Automated risk assessment
- **Feature Gates**: Statsig-based feature control
- **Rate Limiting**: Request throttling and retry logic
- **Audit Logging**: Complete request/response tracking

## API Endpoints

### Protected Email Admin Routes

All routes require `superAdmin` role authentication:

#### `POST /api/admin/email/broadcast`
Send broadcast emails to multiple recipients.

**Authentication**: SuperAdmin JWT required
**Request Body**:
```json
{
  "recipients": ["email1@example.com", "email2@example.com"],
  "subject": "Broadcast Subject",
  "body": "Email content...",
  "template": "optional-template-id"
}
```

#### `POST /api/admin/email/ai/subject`
Generate AI-powered email subjects.

**Authentication**: SuperAdmin JWT + AI_EMAIL_SUBJECT_GENERATION feature flag
**Request Body**:
```json
{
  "purpose": "Product announcement",
  "audience": "existing customers",
  "tone": "professional",
  "keywords": ["new feature", "enhancement"],
  "existingContent": "We're excited to announce..."
}
```

**Response**:
```json
{
  "subject": "Introducing Our Latest Feature Enhancement",
  "confidence": 0.92,
  "reasoning": "Professional tone with clear value proposition",
  "alternatives": [
    "New Feature Alert: Enhanced Functionality Now Available",
    "Your Requested Feature Is Here",
    "Feature Update: What's New This Month"
  ]
}
```

#### `POST /api/admin/email/ai/body`
Generate AI-powered email body content.

**Authentication**: SuperAdmin JWT + AI_EMAIL_BODY_COMPOSITION feature flag
**Request Body**:
```json
{
  "subject": "Feature Announcement",
  "purpose": "Inform customers about new feature",
  "audience": "existing customers",
  "tone": "professional",
  "keyPoints": ["New dashboard", "Improved performance", "Better UX"],
  "callToAction": "Try it now",
  "constraints": {
    "maxLength": 1000,
    "includeDisclaimer": true,
    "mustInclude": ["dashboard", "performance"],
    "mustAvoid": ["complex technical terms"]
  }
}
```

#### `POST /api/admin/email/ai/optimize`
Optimize existing email templates for better performance.

**Authentication**: SuperAdmin JWT + AI_EMAIL_TEMPLATE_OPTIMIZATION feature flag

#### `POST /api/admin/email/ai/personalize`
Generate personalized email content based on recipient data.

**Authentication**: SuperAdmin JWT + AI_EMAIL_PERSONALIZATION feature flag

## Feature Flags

### Email AI Feature Gates

Configure these feature flags in your Statsig dashboard:

| Flag | Purpose | Default |
|------|---------|---------|
| `ai_email_enabled` | Master switch for email AI features | `false` |
| `ai_email_subject_generation` | Enable AI subject line generation | `false` |
| `ai_email_body_composition` | Enable AI email body creation | `false` |
| `ai_email_template_optimization` | Enable AI template optimization | `false` |
| `ai_email_personalization` | Enable AI personalization features | `false` |

### Kill Switches

Emergency kill switches for immediate feature disable:

| Kill Switch | Purpose | Default |
|-------------|---------|---------|
| `kill_ai_email_system` | Disable entire AI email system | `false` |
| `kill_ai_endpoints` | Disable all AI endpoints globally | `false` |

### Feature Flag Implementation

```typescript
// Example feature gate check
import { initializeStatsig, FEATURE_GATES } from "@/lib/feature-gates";
import Statsig from "statsig-node";

const statsigUser = {
  userID: userId.toString(),
  custom: { teamId, feature: "email_ai" }
};

await initializeStatsig();
const enabled = await Statsig.checkGate(statsigUser, FEATURE_GATES.AI_EMAIL_ENABLED);
```

## Environment Variables

### Required Variables

```bash
# JWT Authentication
JWT_SECRET=your-jwt-secret-key
JWT_ISSUER=your-app-name  # Optional
JWT_AUDIENCE=your-app-url # Optional

# Statsig Feature Flags
STATSIG_SERVER_SECRET_KEY=secret-xxxxx
NEXT_PUBLIC_STATSIG_CLIENT_KEY=client-xxxxx

# Vercel AI SDK
OPENAI_API_KEY=sk-xxxxx
VERCEL_AI_EMAIL_MODEL=gpt-4o-mini          # General email AI model
VERCEL_AI_EMAIL_SUBJECT_MODEL=gpt-4o-mini  # Subject generation model
VERCEL_AI_EMAIL_BODY_MODEL=gpt-4o          # Body composition model
VERCEL_AI_EMAIL_TEMPLATE_MODEL=gpt-4o-mini # Template optimization model

# Database (for AI request logging)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

### Optional Variables

```bash
# Environment Detection
VERCEL_ENV=production  # development, preview, production

# AI Model Configuration
VERCEL_AI_MODEL=gpt-4o-mini  # Fallback model for AI operations
```

## Security Considerations

### Content Safety

The AI email system implements multiple layers of content safety:

1. **Prohibited Pattern Detection**:
   - Spam/scam terminology
   - Urgency manipulation tactics
   - Phishing attempts
   - Cryptocurrency schemes

2. **Safety Scoring**:
   - Automated risk assessment (0-1 scale)
   - Configurable safety threshold (default: 0.8)
   - Content rejection for unsafe material

3. **Input Validation**:
   - Maximum content lengths enforced
   - Required field validation
   - Constraint compliance checking

### Authentication Security

1. **JWT Token Security**:
   - Cryptographic signature validation
   - Configurable issuer/audience validation
   - Automatic token expiration handling
   - Secure cookie storage with HttpOnly flag

2. **Role-Based Authorization**:
   - Strict role hierarchy enforcement
   - Least-privilege access model
   - Comprehensive audit logging

3. **Request Validation**:
   - Input sanitization
   - Content length limits
   - Rate limiting protection

### Data Protection

1. **Audit Logging**:
   - All AI requests logged with metadata
   - Request/response data captured
   - Performance metrics tracked
   - Error conditions recorded

2. **Data Retention**:
   - Truncated content storage for audit
   - Configurable retention periods
   - Secure data disposal

## Usage Examples

### Basic Subject Generation

```typescript
import { generateEmailSubject } from "@/lib/ai/email";

const result = await generateEmailSubject(
  {
    purpose: "Welcome new users to our platform",
    audience: "new signups",
    tone: "friendly",
    keywords: ["welcome", "getting started"]
  },
  {
    teamId: 1,
    userId: 123,
    temperature: 0.3
  }
);

console.log(result.subject); // "Welcome to DeelRx - Let's Get You Started!"
```

### Advanced Body Generation

```typescript
import { generateEmailBody } from "@/lib/ai/email";

const result = await generateEmailBody(
  {
    subject: "Welcome to DeelRx",
    purpose: "Onboard new users",
    audience: "first-time users",
    tone: "friendly",
    keyPoints: ["Easy setup", "24/7 support", "Free trial"],
    callToAction: "Complete your setup",
    constraints: {
      maxLength: 800,
      includeDisclaimer: true,
      mustInclude: ["support team", "setup guide"],
      mustAvoid: ["technical jargon", "complex instructions"]
    }
  },
  {
    teamId: 1,
    userId: 123,
    temperature: 0.4
  }
);
```

### Template Optimization

```typescript
import { optimizeEmailTemplate } from "@/lib/ai/email";

const result = await optimizeEmailTemplate(
  {
    html: existingTemplateHtml,
    text: existingTemplateText,
    purpose: "Product announcement",
    targetMetrics: {
      openRate: 25,
      clickRate: 5,
      conversionRate: 2
    }
  },
  {
    teamId: 1,
    userId: 123
  }
);
```

## Monitoring and Observability

### AI Request Logging

All AI operations are automatically logged with:

- Request ID and timestamp
- User and team identification
- Feature and model used
- Input prompt (truncated)
- Generated response (truncated)
- Success/failure status
- Performance duration
- Error details (if applicable)

### Performance Metrics

Monitor these key metrics:

1. **Response Times**: AI generation latency
2. **Success Rates**: Request completion percentages
3. **Safety Scores**: Content safety distributions
4. **Feature Usage**: Feature gate adoption rates
5. **Error Rates**: Failure pattern analysis

### Health Checks

The system provides health check endpoints:

- `/api/health/ai-email` - AI email system status
- `/api/health/feature-gates` - Feature flag connectivity
- `/api/health/jwt` - Authentication system status

## Troubleshooting

### Common Issues

#### 1. JWT Authentication Failures

**Symptoms**: 401/403 errors on email admin routes
**Causes**:
- Missing or invalid JWT_SECRET
- Expired tokens
- Insufficient role permissions
- Cookie/header configuration issues

**Solutions**:
```typescript
// Check token extraction
const token = getTokenFromRequest(request);
console.log('Token found:', !!token);

// Verify token manually
try {
  const payload = await verifyJwt(token);
  console.log('Token payload:', payload);
} catch (error) {
  console.error('Token verification failed:', error);
}

// Check role requirements
const hasRole = ROLE_PRIORITY[payload.role] >= ROLE_PRIORITY['superAdmin'];
```

#### 2. Feature Flag Issues

**Symptoms**: "Feature not enabled" errors despite configuration
**Causes**:
- Statsig initialization failures
- Incorrect feature gate names
- User context issues
- Network connectivity problems

**Solutions**:
```typescript
// Check Statsig initialization
import { initializeStatsig } from "@/lib/feature-gates";
await initializeStatsig();

// Verify feature gate names
console.log('Available gates:', Object.values(FEATURE_GATES));

// Test feature gate directly
const enabled = await Statsig.checkGate(statsigUser, 'ai_email_enabled');
console.log('Feature enabled:', enabled);
```

#### 3. AI Generation Failures

**Symptoms**: AI helper functions throwing errors
**Causes**:
- OpenAI API issues
- Content safety violations
- Rate limiting
- Model configuration problems

**Solutions**:
```typescript
// Check API key configuration
console.log('OpenAI key configured:', !!process.env.OPENAI_API_KEY);

// Test content safety
import { emailAiUtils } from "@/lib/ai/email";
const safety = emailAiUtils.checkContentSafety(content);
console.log('Content safety:', safety);

// Review AI request logs
// Check database ai_requests table for detailed error information
```

#### 4. Performance Issues

**Symptoms**: Slow AI response times
**Causes**:
- Model selection
- Temperature settings
- Content complexity
- Network latency

**Solutions**:
- Use lighter models for simple tasks (gpt-4o-mini)
- Reduce temperature for more deterministic output
- Implement caching for repeated requests
- Add request timeout configurations

### Debugging Tools

#### 1. Request Logging

Enable detailed logging:

```typescript
// Add to your email AI functions
console.log('AI Request:', {
  feature: 'email_subject_generation',
  userId,
  teamId,
  prompt: prompt.substring(0, 100),
  model: EMAIL_SUBJECT_MODEL
});
```

#### 2. Feature Flag Testing

Test feature flags in development:

```bash
# Set environment variables
export STATSIG_SERVER_SECRET_KEY=your-secret-key
export VERCEL_ENV=development

# Test feature gate
curl -X POST http://localhost:3000/api/debug/feature-gates \
  -H "Content-Type: application/json" \
  -d '{"gate": "ai_email_enabled", "userId": "123"}'
```

#### 3. JWT Testing

Test JWT authentication:

```bash
# Generate test token
curl -X POST http://localhost:3000/api/debug/jwt \
  -H "Content-Type: application/json" \
  -d '{"userId": "123", "role": "superAdmin"}'

# Test protected endpoint
curl -X GET http://localhost:3000/api/admin/email/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Best Practices

### Development

1. **Feature Flag Strategy**:
   - Start with flags disabled in production
   - Use gradual rollout percentages
   - Monitor metrics during rollouts
   - Implement quick rollback procedures

2. **Content Safety**:
   - Test safety checks with edge cases
   - Review prohibited patterns regularly
   - Implement human review workflows
   - Monitor safety score distributions

3. **Performance Optimization**:
   - Choose appropriate AI models for tasks
   - Implement caching where possible
   - Use retry mechanisms with backoff
   - Monitor response times and error rates

### Production Deployment

1. **Security Checklist**:
   - [ ] JWT_SECRET is cryptographically secure
   - [ ] Statsig feature flags configured
   - [ ] OpenAI API key secured
   - [ ] Database connection encrypted
   - [ ] Audit logging enabled

2. **Monitoring Setup**:
   - [ ] AI request logging configured
   - [ ] Performance metrics tracked
   - [ ] Error alerting enabled
   - [ ] Feature flag health checks active

3. **Rollout Strategy**:
   - [ ] Feature flags start disabled
   - [ ] Gradual user percentage rollout
   - [ ] A/B testing for AI improvements
   - [ ] Rollback procedures documented

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**:
   - Review AI request logs for errors
   - Monitor safety score trends
   - Check feature gate usage statistics
   - Verify authentication system health

2. **Monthly**:
   - Analyze AI performance metrics
   - Review and update prohibited patterns
   - Optimize model selections
   - Update safety thresholds if needed

3. **Quarterly**:
   - Security audit of JWT implementation
   - Review and rotate secrets
   - Evaluate AI model upgrades
   - Update documentation

### Getting Help

For technical support or questions:

1. **Internal Documentation**: Check this file first
2. **Code Comments**: Review inline documentation
3. **Audit Logs**: Check database logs for detailed error information
4. **Feature Flag Dashboard**: Review Statsig dashboard for flag status
5. **Development Team**: Contact with specific error messages and request IDs

### Change Management

When making changes to the email system:

1. **Code Changes**:
   - Update this documentation
   - Add appropriate tests
   - Follow security review process
   - Update environment variable documentation

2. **Feature Flag Changes**:
   - Document rollout strategy
   - Implement monitoring
   - Plan rollback procedures
   - Coordinate with stakeholders

3. **Security Changes**:
   - Security team review required
   - Penetration testing recommended
   - Audit log retention verification
   - Incident response plan updates

---

## Appendix

### A. Complete Environment Variable Reference

```bash
# Copy these to your .env.local for development
# Ensure all values are properly configured in production

# JWT Authentication (Required)
JWT_SECRET=your-crypto-secure-jwt-secret-min-32-chars
JWT_ISSUER=deelrx-crm                    # Optional: Token issuer
JWT_AUDIENCE=https://deelrxcrm.app       # Optional: Token audience

# Statsig Feature Flags (Required for AI features)
STATSIG_SERVER_SECRET_KEY=secret-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STATSIG_CLIENT_KEY=client-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI Integration (Required for AI features)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# AI Model Configuration (Optional - defaults provided)
VERCEL_AI_EMAIL_MODEL=gpt-4o-mini          # General email AI operations
VERCEL_AI_EMAIL_SUBJECT_MODEL=gpt-4o-mini  # Subject generation
VERCEL_AI_EMAIL_BODY_MODEL=gpt-4o          # Body composition (more capable model)
VERCEL_AI_EMAIL_TEMPLATE_MODEL=gpt-4o-mini # Template optimization

# Database (Required for logging)
DATABASE_URL=postgresql://user:pass@host:5432/database?sslmode=require

# Environment Detection (Auto-set by Vercel)
VERCEL_ENV=development  # development, preview, production
```

### B. JWT Payload Schema

```typescript
interface AppJwtPayload {
  sub: string;                    // Subject (User ID) - Required
  role?: 'user' | 'admin' | 'superAdmin'; // User role - Optional, defaults to 'user'
  iat?: number;                   // Issued At timestamp - Optional
  exp?: number;                   // Expiration timestamp - Optional
  iss?: string;                   // Issuer - Optional, from JWT_ISSUER
  aud?: string;                   // Audience - Optional, from JWT_AUDIENCE
  
  // Custom claims
  teamId?: number;                // Team/Tenant ID - Optional
  email?: string;                 // User email - Optional
  name?: string;                  // User name - Optional
}
```

### C. Feature Gate Configuration

```typescript
// Complete list of email-related feature gates
export const EMAIL_FEATURE_GATES = {
  // Master switches
  AI_EMAIL_ENABLED: 'ai_email_enabled',                    // Enable AI email features
  
  // Specific AI features
  AI_EMAIL_SUBJECT_GENERATION: 'ai_email_subject_generation',      // Subject line AI
  AI_EMAIL_BODY_COMPOSITION: 'ai_email_body_composition',          // Body content AI
  AI_EMAIL_TEMPLATE_OPTIMIZATION: 'ai_email_template_optimization', // Template AI
  AI_EMAIL_PERSONALIZATION: 'ai_email_personalization',            // Personalization AI
  
  // Emergency kill switches
  KILL_AI_EMAIL_SYSTEM: 'kill_ai_email_system',           // Disable all email AI
  KILL_AI_ENDPOINTS: 'kill_ai_endpoints',                 // Disable all AI globally
};
```

### D. API Response Schemas

```typescript
// Subject Generation Response
interface SubjectGenerationResponse {
  subject: string;           // Primary subject line
  confidence: number;        // AI confidence score (0-1)
  reasoning: string;         // Explanation of subject choice
  alternatives: string[];    // Alternative subject lines for A/B testing
}

// Body Generation Response  
interface BodyGenerationResponse {
  body: string;             // Generated email body content
  tone: string;             // Detected/applied tone
  confidence: number;       // AI confidence score (0-1)
  reasoning: string;        // Explanation of content choices
  safetyScore: number;      // Content safety score (0-1)
}

// Template Optimization Response
interface TemplateOptimizationResponse {
  template: string;         // Optimized template HTML
  variables: string[];      // Identified personalization variables
  structure: {              // Template structure breakdown
    header: string;
    body: string; 
    footer: string;
    cta?: string;
  };
  confidence: number;       // Optimization confidence (0-1)
  recommendations: string[]; // Specific improvement recommendations
}
```

This documentation provides a complete reference for the DeelRx CRM email system with JWT authentication and AI helpers. Keep it updated as the system evolves and new features are added.