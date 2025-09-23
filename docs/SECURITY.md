# Security Overview

This document outlines the security measures implemented in DeelRx CRM Phase 5.

## Content Security Policy (CSP)

We implement a strict CSP to prevent XSS attacks:

```typescript
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'nonce-<generated>';
  style-src 'self' 'nonce-<generated>';
  connect-src 'self' https://api.vercel.com https://api.stripe.com https://api.clerk.com https://api.knock.app https://api.statsig.com https://sentry.io https://api.inngest.com https://supabase.co;
  object-src 'none';
  frame-ancestors 'none';
```

### Implementation
- Nonces are generated per request using `nanoid()`
- All inline scripts and styles must use the generated nonce
- External connections are limited to required services only

## Security Headers

### Standard Headers
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy` - Disables unused browser features (geolocation, camera, microphone, payment)

### Production-Only Headers
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` - Enforces HTTPS

## Rate Limiting

### Implementation
- Redis-backed rate limiting using Upstash
- Combined IP + user ID tracking
- Configurable limits per endpoint

### Protected Endpoints
- `/api/stripe/webhook` - 100 requests per hour
- `/api/upload/*` - 50 requests per hour
- `/api/auth/*` - 20 requests per hour
- `/api/admin/*` - 30 requests per hour

### Configuration
```typescript
const limiter = rateLimit({
  key: 'webhook',
  limit: 100,
  window: 3600 // 1 hour
});
```

## Field-Level Encryption

### Algorithm
- AES-256-GCM encryption
- Unique initialization vector (IV) per field
- Authentication tag for integrity verification

### Encrypted Fields
- Customer PII (names, addresses, phone numbers)
- Credit card information (if stored)
- Social Security Numbers
- Tax ID numbers
- Banking information

### Implementation
```typescript
// Encrypt sensitive data before storage
const encrypted = encryptField(sensitiveData, encryptionKey);

// Decrypt when retrieving
const decrypted = decryptField(encrypted, encryptionKey);
```

### Key Management
- Encryption keys stored in secure environment variables
- Key rotation plan documented in OPERATIONS.md
- Keys never logged or exposed in error messages

## Idempotency

### Purpose
Prevents duplicate operations from external API calls:
- Stripe payment processing
- Email notifications
- AI API calls that mutate state

### Implementation
```typescript
// Middleware enforces idempotency keys
app.use('/api/stripe/*', enforceIdempotency);

// Client must provide idempotency key
headers: {
  'idempotency-key': 'unique-operation-id'
}
```

## Secrets Management

### Environment Variables Audit
All required environment variables are validated at application startup:

- Database credentials
- API keys (Stripe, Sentry, Statsig, etc.)
- JWT secrets
- Webhook secrets
- Encryption keys

### Fail-Closed Policy
Application refuses to start if any required environment variable is missing.

### Secret Rotation
- Documented procedures for rotating all secrets
- Zero-downtime rotation for most services
- Emergency rotation procedures

## Authentication & Authorization

### Session Management
- JWT-based sessions with automatic renewal
- Secure HTTP-only cookies
- Configurable session timeouts

### Role-Based Access Control (RBAC)
- Tenant isolation enforced at database level
- Role-based permissions (Owner, Manager, Staff)
- API endpoint protection with role checks

### Multi-Factor Authentication
- TOTP support for sensitive operations
- Backup codes for account recovery
- Admin-enforced MFA policies

## Audit Logging

### Scope
All administrative and financial actions are logged:
- User management operations
- Credit limit changes
- Payment processing
- Data purge operations
- System configuration changes

### Log Format
```typescript
{
  userId: number,
  teamId: number,
  action: string,
  timestamp: ISO8601,
  ipAddress: string,
}
```

### Retention
- Audit logs retained for 7 years
- Regular backup to secure storage
- Access restricted to authorized personnel

## Vulnerability Management

### Dependency Scanning
- Automated security scanning of npm dependencies
- Regular updates of security patches
- CVE monitoring and response procedures

### Code Security
- Static analysis security testing (SAST)
- Security-focused code reviews
- Input validation with Zod schemas

### Infrastructure Security
- Secure deployment practices
- Network segmentation
- Regular security assessments

## Incident Response

### Security Monitoring
- Real-time alerting for security events
- Integration with Sentry for error tracking
- Automated threat detection

### Response Procedures
1. **Detection** - Automated monitoring and alerting
2. **Assessment** - Rapid security impact analysis
3. **Containment** - Immediate threat isolation
4. **Eradication** - Root cause elimination
5. **Recovery** - Service restoration
6. **Lessons Learned** - Post-incident review

### Emergency Contacts
- Security team escalation procedures
- Customer communication templates
- Regulatory reporting requirements

## Compliance

### Data Protection
- GDPR compliance for EU customers
- CCPA compliance for California residents
- SOC 2 Type II controls implementation

### Industry Standards
- PCI DSS compliance for payment processing
- OWASP Top 10 vulnerability mitigation
- ISO 27001 security management practices

## Security Training

### Developer Training
- Secure coding practices
- OWASP guidelines
- Security testing methodologies

### User Education
- Security awareness training
- Phishing simulation programs
- Password security best practices

---

For operational procedures, see [OPERATIONS.md](./OPERATIONS.md).
For go-live checklist, see [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md).