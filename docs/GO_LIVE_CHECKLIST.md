# Go-Live Checklist

This comprehensive checklist ensures a successful production deployment of DeelRx CRM.

## Pre-Go-Live (T-7 days)

### Environment Preparation
- [ ] Production environment provisioned
- [ ] All required environment variables configured
- [ ] SSL certificates installed and verified
- [ ] Domain DNS configured correctly
- [ ] CDN configuration optimized

### Database Setup
- [ ] Production database created and configured
- [ ] Database migrations tested in staging
- [ ] Database backup strategy implemented
- [ ] Connection pooling configured
- [ ] Read replicas set up (if applicable)

### Security Configuration
- [ ] Security headers configured
- [ ] Content Security Policy implemented
- [ ] Rate limiting rules configured
- [ ] Field-level encryption tested
- [ ] Audit logging enabled

### External Services
- [ ] Stripe production keys configured
- [ ] Webhooks configured and tested
- [ ] Sentry production project set up
- [ ] Statsig production environment configured
- [ ] Upstash Redis production instance configured

### Monitoring Setup
- [ ] Health check endpoints implemented
- [ ] Sentry error tracking configured
- [ ] Application performance monitoring enabled
- [ ] Log aggregation configured
- [ ] Alert rules configured

## Go-Live Day (T-0)

### Pre-Deployment Verification
- [ ] All team members available
- [ ] Communication channels set up
- [ ] Rollback plan documented and tested
- [ ] Emergency contacts verified

### Environment Validation
```bash
# Verify all required environment variables
node -e "
const required = [
  'DATABASE_URL',
  'JWT_SECRET', 
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'STATSIG_SERVER_SECRET_KEY',
  'NEXT_PUBLIC_STATSIG_CLIENT_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN'
];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.error('Missing:', missing);
  process.exit(1);
}
console.log('✅ All required environment variables present');
"
```

### Database Migration
```bash
# Run database migrations
npm run db:push

# Verify migration success
npm run db:studio
# Check all tables exist and have correct structure

# Test database connectivity
curl -sf https://api.deelrxcrm.app/api/_health/ready
```

### Application Deployment
- [ ] Deploy application to production
- [ ] Verify deployment success
- [ ] Check application logs for errors
- [ ] Verify all routes responding correctly

### Health Check Verification
```bash
# Test liveness endpoint
curl -sf https://api.deelrxcrm.app/api/_health/live
# Expected: {"status":"live"}

# Test readiness endpoint  
curl -sf https://api.deelrxcrm.app/api/_health/ready
# Expected: {"status":"ready"}

# Test rate limiting
for i in {1..10}; do 
  curl -H "idempotency-key: test$i" https://api.deelrxcrm.app/api/stripe/webhook
done
# Should see 429 responses after limit exceeded
```

### Feature Gate Configuration
```bash
# Verify all gates are properly configured
curl -H "Authorization: Bearer $STATSIG_KEY" \
  https://api.statsig.com/console/v1/gates
  
# Set initial gate states (all OFF for safety)
# - llm_pricing_enabled: OFF
# - llm_credit_enabled: OFF
# - llm_data_enabled: OFF
# - llm_training_enabled: OFF
# - new_credit_ui: OFF
# - kb_uploads_enabled: OFF
# - admin_purge_controls: OFF
# - search_enabled: OFF
```

### Security Verification
```bash
# Test security headers
curl -I https://api.deelrxcrm.app/
# Verify CSP, HSTS, X-Content-Type-Options headers present

# Test rate limiting
curl -X POST https://api.deelrxcrm.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
# Repeat 25 times, should get 429 after limit

# Verify encryption functions
node -e "
const { encryptField, decryptField } = require('./lib/security/encryption');
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
const test = 'sensitive data';
const encrypted = encryptField(test, key);
const decrypted = decryptField(encrypted, key);
console.log(decrypted === test ? '✅ Encryption working' : '❌ Encryption failed');
"
```

### Webhook Testing
```bash
# Test Stripe webhook endpoint
stripe listen --forward-to https://api.deelrxcrm.app/api/webhooks/stripe

# Send test webhook
stripe events resend evt_test_webhook

# Verify webhook processing in logs
# Check for successful webhook signature verification
```

### Integration Testing
- [ ] User registration flow
- [ ] Authentication and session management
- [ ] Payment processing (test mode)
- [ ] Credit system functionality
- [ ] File upload and processing
- [ ] Email notifications
- [ ] Admin panel access

### Performance Testing
```bash
# Load test critical endpoints
ab -n 100 -c 10 https://api.deelrxcrm.app/api/_health/ready

# Monitor response times
curl -w "@curl-format.txt" -s -o /dev/null https://api.deelrxcrm.app/

# Check database connection pool
# Monitor for connection exhaustion under load
```

## Post-Go-Live (T+0 to T+24 hours)

### Immediate Monitoring (First 2 hours)
- [ ] Monitor error rates in Sentry
- [ ] Check application performance metrics
- [ ] Verify health check status
- [ ] Monitor database connection pool
- [ ] Check rate limiting effectiveness

### Extended Monitoring (First 24 hours)
- [ ] Review audit logs for anomalies
- [ ] Monitor feature gate usage
- [ ] Check backup completion
- [ ] Verify all scheduled jobs running
- [ ] Monitor resource utilization

### User Acceptance Testing
- [ ] Admin user can access all features
- [ ] Customer registration works correctly
- [ ] Payment processing functions properly
- [ ] Credit system calculates correctly
- [ ] Email notifications delivered
- [ ] File uploads process successfully

### Feature Rollout Plan
```bash
# Gradual feature enablement (over first week)

# Day 1: Enable basic features for 10% of users
# - Enable llm_pricing_enabled for specific tenants
# - Monitor for issues

# Day 3: Expand to 25% if stable
# - Enable llm_credit_enabled for tested tenants
# - Continue monitoring

# Day 7: Full rollout if all tests pass
# - Enable all features for all users
# - Continue enhanced monitoring
```

## Emergency Procedures

### Rollback Plan
```bash
# If critical issues detected, immediate rollback:

# 1. Disable all feature gates
curl -X POST https://api.statsig.com/console/v1/gates/kill_all

# 2. Revert to previous deployment
vercel --prod --force previous-deployment-url

# 3. Notify stakeholders
# 4. Begin incident response procedures
```

### Incident Response
- [ ] Incident commander identified
- [ ] Communication channels established
- [ ] Escalation procedures documented
- [ ] Customer communication templates ready

## Sign-off Requirements

### Technical Sign-off
- [ ] All health checks passing
- [ ] No critical errors in Sentry
- [ ] All integration tests passing
- [ ] Performance metrics within acceptable range
- [ ] Security scans completed successfully

### Business Sign-off
- [ ] Key user workflows verified
- [ ] Payment processing tested
- [ ] Admin functions accessible
- [ ] Customer support tools working
- [ ] Backup and recovery tested

### Compliance Sign-off
- [ ] Audit logging enabled and functional
- [ ] Data retention policies configured
- [ ] Security controls implemented
- [ ] Privacy controls operational
- [ ] Regulatory requirements met

## Post-Go-Live Week 1

### Daily Checks
- [ ] Review overnight error logs
- [ ] Check backup completion
- [ ] Monitor performance trends
- [ ] Verify scheduled job execution
- [ ] Review user feedback

### Weekly Review
- [ ] Performance optimization opportunities
- [ ] Feature gate usage analysis
- [ ] Security incident review
- [ ] Backup and recovery test
- [ ] User adoption metrics

### Documentation Updates
- [ ] Update runbooks with any new procedures
- [ ] Document any configuration changes
- [ ] Update emergency contact information
- [ ] Review and update monitoring alerts

## Success Criteria

### Technical Metrics
- [ ] Uptime > 99.9%
- [ ] Response time < 2 seconds average
- [ ] Error rate < 0.5%
- [ ] Zero security incidents
- [ ] All health checks consistently green

### Business Metrics
- [ ] User registration completion rate > 90%
- [ ] Payment processing success rate > 99%
- [ ] Customer support ticket volume normal
- [ ] No critical business process failures
- [ ] Positive user feedback

### Security Metrics
- [ ] No failed security scans
- [ ] Audit logs complete and accessible
- [ ] Rate limiting effective (no abuse detected)
- [ ] All security headers properly configured
- [ ] Encryption functioning correctly

---

## Emergency Contacts

### Technical Team
- **Lead Engineer**: [Name] - [Phone] - [Email]
- **DevOps Lead**: [Name] - [Phone] - [Email]
- **Security Lead**: [Name] - [Phone] - [Email]

### Business Team
- **Product Manager**: [Name] - [Phone] - [Email]
- **Customer Success**: [Name] - [Phone] - [Email]
- **Executive Sponsor**: [Name] - [Phone] - [Email]

### External Vendors
- **Vercel Support**: [Contact Information]
- **Stripe Support**: [Contact Information]
- **Sentry Support**: [Contact Information]

---

**Note**: This checklist should be reviewed and customized for each deployment. All items must be completed and verified before considering the go-live successful.