# Operations Manual

This document provides operational procedures and runbooks for DeelRx CRM.

## Health Monitoring

### Health Check Endpoints

#### `/api/_health/live`
- **Purpose**: Liveness probe for container orchestration
- **Response**: `{ "status": "live" }`
- **Status Codes**: 200 (always)
- **Usage**: Kubernetes/Docker health checks

#### `/api/_health/ready`
- **Purpose**: Readiness probe for load balancer routing
- **Checks**: Database connectivity, Redis availability, required environment variables
- **Response**: `{ "status": "ready" }` or `{ "error": "..." }`
- **Status Codes**: 200 (ready), 503 (not ready)

### Monitoring Stack

#### Sentry Integration
- **Error Tracking**: Automatic error capture and alerting
- **Performance Monitoring**: Transaction tracing and performance metrics
- **Release Tracking**: Deploy-linked error attribution
- **User Context**: Sanitized user identification (no PII)

#### Application Metrics
- **Health Checks**: Automated endpoint monitoring
- **Rate Limiting**: Request rate and rejection metrics
- **Feature Gates**: Gate activation and usage tracking
- **Database**: Connection pool and query performance

### Alerting

#### Critical Alerts
- Health check failures (>5 minutes)
- Database connection failures
- High error rates (>5% in 5 minutes)
- Rate limit threshold breaches
- Payment processing failures

#### Warning Alerts
- Elevated response times (>2s average)
- Low disk space (<20%)
- Memory usage (>80%)
- Failed feature gate checks

## On-Call Runbook

### Incident Response

#### 1. Initial Assessment (0-5 minutes)
1. Check health endpoints: `/api/_health/live` and `/api/_health/ready`
2. Review Sentry dashboard for recent errors
3. Verify external service status (Stripe, Vercel, Supabase)
4. Check system resource utilization

#### 2. Immediate Actions (5-15 minutes)
1. If database issues: Check connection pool, restart if needed
2. If Redis issues: Verify Upstash connectivity, fallback to in-memory
3. If rate limiting issues: Adjust limits or implement temporary bypass
4. If external API issues: Enable circuit breakers

#### 3. Communication (15-30 minutes)
1. Update status page if customer-facing impact
2. Notify internal stakeholders
3. Create incident in tracking system
4. Begin customer communication if needed

#### 4. Resolution (Ongoing)
1. Implement fix or workaround
2. Verify resolution with health checks
3. Monitor for 30 minutes post-resolution
4. Document lessons learned

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
curl -sf https://api.deelrxcrm.app/api/_health/ready

# If failed, check connection string and credentials
# Verify Neon/Supabase service status
# Restart application if connection pool exhausted
```

#### Redis/Rate Limiting Issues
```bash
# Check Redis connectivity
curl -sf https://upstash.io/api/health

# Temporary rate limit bypass (emergency only)
# Set DISABLE_RATE_LIMITING=true in environment
# Restart application
```

#### High Error Rates
```bash
# Check Sentry for error patterns
# Review recent deployments
# Check external service dependencies
# Consider rolling back if recent deploy
```

#### Payment Processing Issues
```bash
# Check Stripe service status
# Verify webhook endpoints responding
# Review failed payment logs in Stripe dashboard
# Check idempotency key conflicts
```

## Backup and Recovery

### Database Backups

#### Automated Backups
- **Frequency**: Daily full backups, hourly transaction log backups
- **Retention**: 30 days for daily, 7 days for hourly
- **Location**: Encrypted backup storage
- **Verification**: Daily restore tests on non-production environment

#### Manual Backup
```bash
# Create manual backup before major changes
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Encrypt backup file
gpg --symmetric --cipher-algo AES256 backup_file.sql
```

#### Recovery Procedures
```bash
# Point-in-time recovery
# 1. Stop application traffic
# 2. Restore from backup
psql $DATABASE_URL < backup_file.sql

# 3. Verify data integrity
# 4. Resume application traffic
# 5. Monitor for issues
```

### Application State Recovery

#### Configuration Backup
- Environment variables stored in secure vault
- Feature gate configurations backed up daily
- API keys and secrets documented in secure location

#### Disaster Recovery
1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 1 hour
3. **Failover Procedure**: Documented step-by-step process
4. **Testing**: Monthly disaster recovery drills

## Key Rotation

### Encryption Keys

#### Schedule
- **Routine Rotation**: Every 90 days
- **Emergency Rotation**: Within 24 hours of compromise
- **Testing**: Key rotation tested monthly in staging

#### Procedure
1. Generate new encryption key
2. Update environment variables
3. Decrypt/re-encrypt existing data (background job)
4. Verify all encrypted data accessible
5. Retire old key after 30 days

### API Keys

#### JWT Signing Keys
```bash
# Generate new key
openssl rand -base64 32

# Update JWT_SECRET environment variable
# Existing sessions will be invalidated
# Users will need to re-authenticate
```

#### External Service Keys
1. **Stripe**: Rotate in Stripe dashboard, update environment
2. **Sentry**: Generate new DSN, update configuration
3. **Statsig**: Rotate in Statsig console
4. **Third-party services**: Follow vendor-specific procedures

### Webhook Secrets
```bash
# Stripe webhook secret rotation
# 1. Generate new secret in Stripe dashboard
# 2. Update STRIPE_WEBHOOK_SECRET environment variable
# 3. Test webhook delivery
# 4. Monitor for failures
```

## Deployment Procedures

### Pre-Deployment Checklist
- [ ] Database migrations tested in staging
- [ ] Feature gates configured
- [ ] Environment variables updated
- [ ] Backup created
- [ ] Rollback plan prepared

### Deployment Process
1. **Pre-deploy**: Health check baseline
2. **Deploy**: Zero-downtime deployment via Vercel
3. **Post-deploy**: Health check verification
4. **Monitoring**: 30-minute observation period
5. **Sign-off**: Deployment confirmation

### Rollback Procedures
```bash
# Immediate rollback if critical issues
vercel --prod --force

# Database rollback (if needed)
# 1. Stop application
# 2. Restore from backup
# 3. Restart application
# 4. Verify functionality
```

## Security Operations

### Access Management

#### Administrative Access
- Multi-factor authentication required
- Regular access reviews (quarterly)
- Principle of least privilege
- Session recording for audit trails

#### Emergency Access
- Break-glass procedures documented
- Emergency contact information
- Temporary access provisioning
- Immediate access review post-incident

### Security Monitoring

#### Log Analysis
- Centralized logging with structured format
- Automated anomaly detection
- Regular log review procedures
- Long-term log retention for compliance

#### Vulnerability Management
- Automated dependency scanning
- Monthly security assessment
- Penetration testing (annual)
- Bug bounty program

## Performance Optimization

### Database Optimization

#### Query Performance
```sql
-- Regular index maintenance
REINDEX DATABASE deelrx_crm;

-- Query performance analysis
EXPLAIN ANALYZE SELECT ...;

-- Connection pool optimization
-- Monitor connection usage patterns
-- Adjust pool size based on load
```

#### Caching Strategy
- Redis caching for frequently accessed data
- Application-level caching with TTL
- CDN caching for static assets
- Cache invalidation procedures

### Application Performance

#### Rate Limiting Tuning
```typescript
// Monitor rate limit hit rates
// Adjust limits based on usage patterns
// Implement gradual backoff
// Customer-specific limit overrides
```

#### Feature Gate Performance
- Gate evaluation caching
- Fallback strategies for gate failures
- Performance impact monitoring
- A/B testing for optimization

## Compliance and Auditing

### Audit Trail Maintenance
- Automated audit log retention
- Regular audit log backup
- Access log monitoring
- Compliance report generation

### Data Retention
- Customer data retention policies
- Automated data purging procedures
- Legal hold procedures
- Data export capabilities

### Regulatory Compliance
- GDPR compliance monitoring
- CCPA compliance procedures
- SOC 2 control implementation
- Regular compliance assessments

## Emergency Procedures

### Data Breach Response
1. **Immediate**: Contain the breach
2. **Assessment**: Determine scope and impact
3. **Notification**: Legal and regulatory requirements
4. **Remediation**: Fix vulnerabilities
5. **Communication**: Customer and stakeholder updates

### Service Outage Response
1. **Detection**: Automated monitoring alerts
2. **Response**: Immediate investigation
3. **Communication**: Status page updates
4. **Resolution**: Fix and verification
5. **Post-mortem**: Root cause analysis

### Business Continuity
- Essential personnel contact information
- Alternative communication channels
- Backup facility procedures
- Vendor escalation contacts

---

For security details, see [SECURITY.md](./SECURITY.md).
For go-live procedures, see [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md).