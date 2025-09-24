# Cleanup Procedures

## Overview
This document outlines code cleanup and maintenance procedures for the DeelRx CRM repository to maintain code quality, remove technical debt, and ensure optimal performance.

## Regular Maintenance Tasks

### Daily Operations
- [ ] Review and merge approved pull requests
- [ ] Monitor error rates in Sentry dashboard
- [ ] Check database connection health via monitoring
- [ ] Validate backup integrity

### Weekly Operations
- [ ] Review and update dependencies for security patches
- [ ] Clean unused blob storage files (automated via cron)
- [ ] Archive old audit logs (>90 days)
- [ ] Review and update feature flag configurations

### Monthly Operations
- [ ] Dependency audit and upgrades
- [ ] Database performance analysis and optimization
- [ ] Code quality metrics review
- [ ] Documentation updates and synchronization

## Code Cleanup Procedures

### Legacy Code Removal
**Target: `legacy-replit/` directory**

#### Pre-Migration Checklist
- [ ] AI services fully migrated to Next.js structure
- [ ] All database references updated to new schema
- [ ] API routes tested and functional
- [ ] Feature gates properly configured

#### Removal Steps
```bash
# 1. Create backup branch
git checkout -b cleanup-legacy-code
git stash push -m "Pre-cleanup stash"

# 2. Remove legacy directory
rm -rf legacy-replit/

# 3. Update any remaining imports
grep -r "legacy-replit" . --exclude-dir=node_modules
# Fix any found references

# 4. Update documentation
# Remove references to legacy paths
# Update file paths in documentation

# 5. Test build
npm run build
npm run test

# 6. Commit and create PR
git add .
git commit -m "cleanup: remove legacy-replit directory after AI migration"
git push origin cleanup-legacy-code
```

### Duplicate Code Elimination

#### Database Schema Consolidation
- [ ] Remove duplicate type definitions
- [ ] Consolidate schema exports
- [ ] Update import statements throughout codebase

#### Component Deduplication
- [ ] Audit similar components for consolidation opportunities
- [ ] Create shared component library
- [ ] Eliminate one-off components that could use shared variants

### Unused Code Detection
```bash
# Find unused exports
npx ts-unused-exports tsconfig.json

# Find unused dependencies
npx depcheck

# Find unused files
npx unimported
```

## Database Maintenance

### Query Optimization
```sql
-- Identify slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;
```

### Data Archival
- **Activity Events**: Archive events older than 1 year
- **Audit Logs**: Archive logs older than 2 years (compliance requirement)
- **AI Requests**: Archive requests older than 6 months
- **Error Logs**: Archive logs older than 90 days

### Index Maintenance
```sql
-- Rebuild fragmented indexes
REINDEX INDEX CONCURRENTLY idx_customers_tenant_id;
REINDEX INDEX CONCURRENTLY idx_orders_created_at;

-- Analyze table statistics
ANALYZE customers;
ANALYZE orders;
ANALYZE payments;
```

## File System Cleanup

### Blob Storage Management
**Automated Cleanup Script**: `scripts/cleanup-blob-storage.sh`
```bash
#!/bin/bash
# Remove orphaned blob files
# Delete files not referenced in database
# Archive old uploads per retention policy
```

### Log File Rotation
- Application logs: 30-day retention
- Access logs: 90-day retention  
- Error logs: 1-year retention
- Audit logs: 7-year retention (compliance)

### Temporary File Cleanup
```bash
# Clean Next.js build cache
rm -rf .next/cache

# Clean dependency cache
npm cache clean --force
pnpm store prune

# Clean uploaded temp files
find uploads/temp -mtime +1 -delete
```

## Code Quality Maintenance

### Linting and Formatting
```bash
# Fix auto-fixable linting issues
npm run lint:fix

# Format all code
npm run format

# Type check
npm run type-check

# Run full quality checks
npm run quality-check
```

### Dead Code Elimination
```bash
# Remove unused imports
npx @typescript-eslint/eslint-plugin --fix

# Remove console.log statements in production
grep -r "console\." src/ --exclude-dir=node_modules
```

### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npm run analyze

# Check for duplicate dependencies
npm ls --depth=0
pnpm list --depth=0
```

## Security Maintenance

### Dependency Security Audits
```bash
# Check for vulnerabilities
npm audit
pnpm audit

# Update vulnerable packages
npm audit fix
pnpm audit --fix

# Check for outdated packages
npm outdated
pnpm outdated
```

### Environment Cleanup
- [ ] Remove unused environment variables
- [ ] Rotate API keys quarterly
- [ ] Update webhook secrets
- [ ] Review and update CORS settings

### Access Control Review
- [ ] Audit user permissions quarterly
- [ ] Remove inactive team members
- [ ] Review API key usage
- [ ] Update password policies

## Performance Optimization

### Bundle Optimization
```bash
# Analyze bundle
npm run build:analyze

# Check for unused CSS
npx purgecss --css dist/**/*.css --content dist/**/*.html
```

### Database Performance
```bash
# Update table statistics
psql -c "ANALYZE;"

# Check for missing indexes
psql -c "SELECT * FROM pg_stat_user_tables WHERE seq_scan > 0;"

# Vacuum analyze
psql -c "VACUUM ANALYZE;"
```

### Image Optimization
- [ ] Compress uploaded images
- [ ] Convert to WebP format where supported
- [ ] Generate multiple sizes for responsive images
- [ ] Remove EXIF data for privacy

## Monitoring and Alerts

### Cleanup Metrics
- Lines of code reduction
- Bundle size improvements
- Database query performance
- Error rate changes
- Page load time improvements

### Automated Checks
```yaml
# GitHub Actions workflow
name: Code Quality Check
on:
  push:
    branches: [main]
  pull_request:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Type check
        run: npm run type-check
      - name: Test
        run: npm run test
      - name: Build
        run: npm run build
```

## Documentation Cleanup

### Keep Updated
- [ ] API documentation matches implementation
- [ ] Environment variable documentation
- [ ] Deployment procedures
- [ ] Troubleshooting guides

### Remove Outdated
- [ ] Legacy API references
- [ ] Deprecated feature documentation
- [ ] Old deployment procedures
- [ ] Unused configuration examples

## Rollback Procedures

### Code Rollback
```bash
# Create rollback branch
git checkout -b rollback-cleanup-$(date +%Y%m%d)

# Revert specific cleanup commits
git revert <commit-hash>

# Test rollback
npm run build
npm run test

# Deploy if tests pass
git push origin rollback-cleanup-$(date +%Y%m%d)
```

### Database Rollback
- Maintain database backups before major cleanups
- Test restoration procedures monthly
- Document rollback steps for each cleanup operation

## Cleanup Schedule

### Phase 1: Legacy Code (Immediate)
- [ ] Remove `legacy-replit/` directory
- [ ] Update all import references
- [ ] Test and validate functionality

### Phase 2: Code Quality (Week 2)
- [ ] Eliminate duplicate components
- [ ] Consolidate utility functions
- [ ] Optimize bundle size

### Phase 3: Database (Week 3)
- [ ] Archive old data
- [ ] Optimize queries
- [ ] Rebuild indexes

### Phase 4: Documentation (Week 4)
- [ ] Remove outdated docs
- [ ] Update API references
- [ ] Sync internal and public docs

## Success Metrics

### Code Quality
- Reduced bundle size by >20%
- Eliminated duplicate code files
- Improved TypeScript strict mode compliance
- Zero linting errors

### Performance
- Faster build times
- Improved page load speeds
- Reduced database query times
- Lower memory usage

### Maintenance
- Reduced technical debt score
- Faster onboarding for new developers
- Easier debugging and troubleshooting
- Simplified deployment procedures

## Automation Opportunities

### GitHub Actions
- Automated dependency updates
- Code quality checks on PRs
- Bundle size monitoring
- Security vulnerability scanning

### Cron Jobs
- Database maintenance tasks
- Log rotation
- Blob storage cleanup
- Backup verification

### Monitoring Alerts
- Bundle size threshold alerts
- Performance regression detection
- Code quality metric tracking
- Technical debt accumulation warnings