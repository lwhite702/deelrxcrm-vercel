# Alerting & Incident Response

This document outlines the alerting strategy, escalation procedures, and incident response playbooks for the DeelRx CRM system.

## Alerting Overview

The system implements multi-layered alerting across:
- **Sentry**: Application errors and performance issues
- **Knock/Resend**: Notification delivery failures
- **Inngest**: Background job failures and retries
- **Health Checks**: Service availability monitoring

## Sentry Alerts

### Error Rate Alerts

**Critical Errors (Immediate Response)**
- API endpoints with > 5% error rate in 5 minutes
- Database connection failures
- Payment processing errors
- Authentication system failures

**Warning Errors (30-minute Response)**
- Background job failure rate > 10% in 15 minutes
- File upload failures > 20% in 10 minutes
- Feature gate evaluation errors

### Performance Alerts

**Response Time Degradation**
- P95 response time > 2 seconds for critical endpoints
- Database query time > 1 second average
- Background job processing time > 30 seconds

**Resource Utilization**
- Memory usage > 80% sustained for 10 minutes
- High error rates correlated with memory spikes

### Alert Configuration

```javascript
// Sentry Alert Rules
{
  "conditions": [
    {
      "id": "sentry.rules.conditions.event_frequency.EventFrequencyCondition",
      "value": 10,
      "time": "minute",
      "name": "The issue is seen more than 10 times in 1m"
    }
  ],
  "actions": [
    {
      "id": "sentry.rules.actions.notify_email.NotifyEmailAction",
      "targetType": "Team",
      "targetIdentifier": "engineering"
    }
  ]
}
```

### Error Context Requirements

All Sentry events must include:
- **User Context**: User ID, email, role
- **Request Context**: Endpoint, method, parameters
- **Business Context**: Team ID, operation type, feature flags
- **Technical Context**: Database queries, external API calls

## Notification Delivery Alerts

### Knock Webhook Alerts

Monitor Knock delivery webhooks for:
- **Bounce Rate**: > 5% bounce rate in 1 hour
- **Delivery Failures**: > 10 failed deliveries in 15 minutes
- **Webhook Delays**: > 5 minute delivery delay

### Resend Fallback Monitoring

Track fallback activation:
- **Fallback Rate**: > 20% fallback usage in 30 minutes
- **Resend Failures**: Any Resend API errors (critical)
- **Double Failure**: Both Knock and Resend fail (page immediately)

### Notification Playbook

#### Knock Service Degradation
1. **Verify**: Check Knock status page and dashboards
2. **Assess**: Determine if fallback is working properly
3. **Communicate**: Notify users if notifications are delayed
4. **Monitor**: Track fallback success rates
5. **Escalate**: Contact Knock support if needed

#### Resend API Issues
1. **Immediate**: Check Resend status and API limits
2. **Failover**: Consider temporary SMTP fallback if available
3. **Communication**: Alert stakeholders about notification delays
4. **Recovery**: Test both providers once service is restored

### Email Bounce Handling

**Soft Bounces** (Temporary issues)
- Retry up to 3 times with exponential backoff
- Log for pattern analysis
- No user action required

**Hard Bounces** (Permanent failures)
- Mark email as invalid in user record
- Notify user via alternative channel (in-app)
- Require email verification for updates

**Complaint/Spam Reports**
- Immediately suppress future emails to address
- Review content for spam indicators
- Update email templates if needed

## Inngest Job Alerts

### Job Failure Monitoring

**Critical Job Failures** (Immediate)
- Payment processing jobs fail > 2 times
- Purge operations fail (data integrity risk)
- Credit reminder jobs fail (business impact)

**Routine Job Issues** (1-hour response)
- KB link verification failures
- File cleanup job issues
- Activity tracking delays

### Retry Pattern Analysis

Monitor for concerning patterns:
- Jobs consistently failing at same step
- Exponential backoff hitting maximum delays
- Resource exhaustion causing timeouts

### Job Recovery Procedures

#### Failed Payment Processing
1. **Check Stripe**: Verify Stripe API status and webhooks
2. **Database State**: Confirm transaction records are consistent
3. **Manual Recovery**: Process pending transactions manually if needed
4. **Prevention**: Adjust retry logic or timeouts

#### Background Job Backlog
1. **Identify Bottleneck**: Check job queue depths and processing rates
2. **Scale Resources**: Increase Inngest concurrency limits
3. **Prioritize**: Process critical jobs first (payments, alerts)
4. **Monitor**: Track queue recovery rate

#### Data Consistency Issues
1. **Immediate Stop**: Pause affected job types
2. **Assess Impact**: Identify affected records and users
3. **Data Recovery**: Restore from backups if necessary
4. **Fix and Test**: Update job logic and test thoroughly
5. **Gradual Resume**: Re-enable jobs with enhanced monitoring

## Health Check Monitoring

### Readiness Check Failures

**Database Connectivity Issues**
```bash
# Quick diagnosis
curl -f http://localhost:3000/api/_health/ready || echo "Service not ready"

# Database connection test
psql $DATABASE_URL -c "SELECT 1" || echo "DB connection failed"
```

**Missing Environment Variables**
- Check deployment configuration
- Verify secret management system
- Update environment in staging first

### Liveness Check Failures

**Process Health Issues**
- High memory usage (> 90%)
- CPU saturation (> 95% sustained)
- Event loop blocking (Node.js specific)

**Recovery Actions**
1. **Immediate**: Restart affected instances
2. **Investigate**: Check logs for memory leaks or infinite loops
3. **Scale**: Add more instances if load-related
4. **Fix**: Deploy fixes for identified issues

## Escalation Procedures

### Severity Levels

**P0 - Critical (Page Immediately)**
- Complete service outage
- Data corruption or loss
- Security breach
- Payment processing down

**P1 - High (30-minute Response)**
- Partial service degradation
- High error rates (> 5%)
- Background job failures affecting business
- Performance degradation (> 2x normal)

**P2 - Medium (2-hour Response)**
- Minor feature issues
- Non-critical job failures
- Moderate performance issues
- Notification delays

**P3 - Low (Next Business Day)**
- Cosmetic issues
- Documentation problems
- Non-urgent optimization opportunities

### Contact Information

**On-Call Engineer**: primary-oncall@company.com
**Engineering Manager**: eng-manager@company.com
**CTO**: cto@company.com

**External Vendors**:
- Sentry Support: support@sentry.io
- Knock Support: support@knock.app  
- Resend Support: support@resend.com
- Inngest Support: support@inngest.com

### Escalation Timeline

```
Incident Detected
    ↓
P0: Page immediately
P1: Alert within 30 minutes
P2: Email within 2 hours
P3: Next business day
    ↓
Initial Response
    ↓
15 minutes: Acknowledge alert
30 minutes: Initial assessment
1 hour: Update stakeholders
    ↓
Resolution Timeline
    ↓
P0: 1 hour target resolution
P1: 4 hour target resolution
P2: 24 hour target resolution
P3: Next sprint
```

## Incident Response Playbooks

### Database Issues

**Symptoms**: Health checks failing, query timeouts, connection errors

**Initial Response**:
1. Check database dashboard and metrics
2. Verify connection pool status
3. Look for long-running queries
4. Check disk space and resource usage

**Escalation**: If not resolved in 30 minutes, contact database provider

### Payment Processing Issues

**Symptoms**: Stripe webhook failures, charge processing errors

**Initial Response**:
1. Check Stripe dashboard for service status
2. Verify webhook endpoint is responding
3. Review recent charge attempts and failures
4. Check for API rate limiting

**Communication**: Notify finance team of any payment delays

### Authentication System Failures

**Symptoms**: Login failures, session validation errors, unauthorized access

**Initial Response**:
1. Check session management system
2. Verify JWT token validation
3. Review authentication logs
4. Test login flow end-to-end

**Security**: Consider temporary service restriction if security breach suspected

### Background Job System Issues

**Symptoms**: Jobs not processing, queue backlog, timeout errors

**Initial Response**:
1. Check Inngest dashboard and logs
2. Verify job registration and function deployment
3. Look for resource constraints or external API issues
4. Manually trigger test jobs

**Business Impact**: Assess which jobs affect user experience vs internal operations

## Monitoring Dashboards

### Sentry Dashboard
- Error rates by endpoint
- Performance trends
- User impact metrics
- Release comparison

### Application Metrics
- API response times
- Database query performance
- Background job success rates
- Feature gate usage

### Infrastructure Monitoring
- Server resource utilization
- Database connection pools
- External service response times
- Cache hit rates

## Post-Incident Reviews

### Required for All P0/P1 Incidents

**Timeline Documentation**:
- When was the incident first detected?
- How long did initial response take?
- What was the root cause?
- When was service fully restored?

**Impact Assessment**:
- How many users were affected?
- What functionality was impacted?
- Were there any data integrity issues?
- What was the business impact?

**Action Items**:
- What monitoring could have detected this sooner?
- What changes prevent this from happening again?
- Are there process improvements needed?
- Should alert thresholds be adjusted?

### Incident Template

```markdown
# Incident Report: [Date] - [Brief Description]

## Summary
- Start Time: 
- End Time:
- Duration:
- Severity: P0/P1/P2/P3

## Impact
- Users Affected:
- Services Impacted:
- Business Impact:

## Root Cause
[Detailed technical explanation]

## Timeline
- HH:MM - Incident started
- HH:MM - First detection
- HH:MM - Investigation began
- HH:MM - Root cause identified
- HH:MM - Fix implemented
- HH:MM - Service restored
- HH:MM - Incident closed

## Action Items
- [ ] Immediate fixes
- [ ] Long-term improvements
- [ ] Monitoring enhancements
- [ ] Process updates

## Lessons Learned
[What went well, what could be improved]
```

## Alert Tuning

### Avoiding Alert Fatigue

**Prioritization**:
- Only alert on actionable issues
- Use warning vs critical thresholds
- Group related alerts
- Implement escalation delays

**Threshold Adjustment**:
- Review alert accuracy monthly
- Adjust based on false positive rates
- Consider time-of-day variations
- Account for traffic patterns

**Alert Grouping**:
- Combine related error types
- Use intelligent grouping in Sentry
- Implement alert dependencies
- Reduce noise during known issues

This alerting strategy ensures rapid response to critical issues while maintaining sustainable on-call practices and clear escalation procedures.