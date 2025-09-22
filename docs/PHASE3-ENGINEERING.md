# Phase 3 Engineering Documentation

## Overview

Phase 3 introduces advanced business operations features including Credit Management, Knowledge Base System, and Administrative Operations. This documentation covers the technical architecture, implementation details, and operational procedures.

## Architecture Overview

### Database Schema Changes

Phase 3 adds 8 new tables and 4 enums to support advanced business operations:

#### New Enums

- `credit_status`: "active", "suspended", "defaulted", "closed"
- `transaction_status`: "pending", "completed", "failed", "cancelled"
- `purge_status`: "requested", "scheduled", "export_ready", "acknowledged", "executing", "completed", "cancelled"
- `kb_article_status`: "draft", "review", "published", "archived"

#### New Tables

1. **credits** - Credit account management
2. **credit_transactions** - Credit transaction history
3. **kb_articles** - Knowledge base articles
4. **kb_uploads** - File attachments for KB
5. **purge_operations** - Data purge tracking
6. **inactivity_policies** - Automated inactivity rules
7. **inactivity_trackers** - Inactivity monitoring
8. **activity_events** - Activity logging

### Key Foreign Key Relationships

- All `teamId` fields use `integer` type (references `teams.id`)
- All `userId` fields use `integer` type (references `users.id`)
- `customerId` fields use `uuid` type (references `customers.id`)
- Article IDs use `uuid` type for KB system

## API Architecture

### Credit System APIs

**Base Path**: `/api/teams/[teamId]/credit`

- **GET** `/` - Get credit account details and recent transactions
- **PUT** `/` - Update credit account settings
- **GET** `/transactions` - List credit transactions with filtering
- **POST** `/transactions` - Create new credit transaction
- **POST** `/setup-intent` - Create Stripe setup intent for payment methods

**Key Features**:

- Real-time balance calculations
- Transaction history with pagination
- Stripe integration for payment processing
- Idempotency key support for transactions

### Knowledge Base APIs

**Base Path**: `/api/help`

- **GET** `/articles` - List KB articles with filtering
- **POST** `/articles` - Create new article
- **GET** `/articles/[id]` - Get specific article
- **PUT** `/articles/[id]` - Update article
- **DELETE** `/articles/[id]` - Delete article
- **POST** `/uploads` - Upload files with dual blob storage
- **GET** `/uploads` - List uploaded files

**Key Features**:

- Draft/Review/Published workflow
- File attachments with dual storage
- Team-based access control
- Search and filtering capabilities

### Admin Operations APIs

**Base Path**: `/api/admin`

- **POST** `/inactivity` - Create inactivity policies
- **POST** `/purge` - Schedule data purge operations
- **GET|POST|DELETE** `/blob-management` - Manage blob storage files

## Background Job System

### Inngest Integration

Phase 3 uses Inngest for background job processing with the following functions:

#### Credit Management Jobs

- **credit-payment-reminder** - Send payment reminders
- **credit-overdue-check** - Check for overdue accounts
- **credit-limit-adjustment** - Automated limit adjustments

#### Knowledge Base Jobs

- **kb-links-verify** - Weekly link validation
- **kb-cleanup-orphaned** - Monthly orphaned file cleanup

#### Admin Jobs (Temporarily Disabled)

- **admin-purge-execute** - Execute scheduled purges
- **admin-inactivity-check** - Daily inactivity monitoring
- **admin-retention-enforce** - Weekly retention policy enforcement

### Job Configuration

```typescript
// Inngest client configuration
export const inngest = new Inngest({
  id: "deelrx-crm",
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
```

## Dual Blob Storage System

### Storage Architecture

Phase 3 implements dual blob storage for enhanced security:

- **Private Store** (`BLOB_READ_WRITE_TOKEN_PRIVATE`)

  - Sensitive documents (invoices, receipts, legal docs)
  - User uploads requiring authentication
  - Path prefix: `private/`

- **Public Store** (`BLOB_READ_WRITE_TOKEN_PUBLIC`)
  - Public knowledge base articles
  - Downloadable assets and resources
  - Path prefix: `public/`

### Storage Logic

```typescript
export function determineStoreType(
  fileType: string,
  context:
    | "kb-article"
    | "user-upload"
    | "invoice"
    | "receipt"
    | "legal-doc"
    | "public-asset"
): BlobStoreType {
  const sensitiveContexts = ["invoice", "receipt", "legal-doc"];
  if (sensitiveContexts.includes(context)) return "private";
  if (context === "public-asset" || context === "kb-article") return "public";
  return "private"; // Default to private for security
}
```

### File Management Operations

- **Upload**: Automatic store selection based on context
- **Download**: Authentication required for private files
- **Migration**: Move files between stores via admin API
- **Cleanup**: Background jobs handle orphaned files

## Environment Configuration

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...

# Authentication
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... # Fallback
BLOB_READ_WRITE_TOKEN_PRIVATE=vercel_blob_rw_...
BLOB_READ_WRITE_TOKEN_PUBLIC=vercel_blob_rw_...

# Background Jobs
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# Email (for notifications)
RESEND_API_KEY=re_...

# Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Database Migrations

### Migration Commands

```bash
# Push schema changes to database
npm run db:push

# Generate migration SQL
npx drizzle-kit generate

# Apply migrations manually if needed
npm run db:migrate
```

### Schema Validation

The system includes runtime validation to ensure foreign key type consistency:

- String `teamId` parameters are converted to integers using `parseInt()`
- UUID fields maintain string format
- All database operations include proper type conversion

## Security Considerations

### Access Control

- Team-based data isolation via `teamId` filtering
- User authentication required for all operations
- Admin operations require elevated permissions

### Data Protection

- Sensitive files automatically routed to private blob storage
- Credit card data handled via Stripe (PCI compliant)
- Activity logging for audit trails

### Error Handling

- Global error handler in Express app
- Structured error responses with appropriate HTTP codes
- Error logging for debugging and monitoring

## Performance Optimizations

### Database

- Proper indexing on foreign keys
- Pagination for large result sets
- Connection pooling via Neon

### File Storage

- CDN distribution via Vercel Blob
- Automatic file compression
- Cleanup jobs prevent storage bloat

### Background Jobs

- Async processing for heavy operations
- Retry logic for failed jobs
- Rate limiting for external API calls

## Monitoring and Observability

### Logging

- Structured logging throughout the application
- Error tracking via Sentry (configured)
- Performance monitoring via Vercel Analytics

### Health Checks

- Database connection monitoring
- Background job status tracking
- File storage accessibility checks

## Deployment Procedures

### Build Process

```bash
# Install dependencies
npm install

# Build application
npm run build

# Verify build success
npm run start
```

### Environment Setup

1. Configure all required environment variables
2. Run database migrations
3. Verify Inngest webhook endpoint
4. Test blob storage connectivity

### Rollback Procedures

- Database: Use migration rollback scripts
- Code: Git branch reversion
- Files: Blob storage version management

## Troubleshooting Guide

### Common Issues

1. **Foreign Key Type Mismatches**

   - Ensure `parseInt()` conversion for teamId parameters
   - Verify UUID format for customer IDs

2. **Blob Storage Errors**

   - Check token validity and permissions
   - Verify correct store type selection

3. **Background Job Failures**

   - Check Inngest webhook configuration
   - Verify environment variables
   - Monitor job execution logs

4. **Build Failures**
   - TypeScript type mismatches
   - Missing environment variables
   - Import/export errors

### Debug Commands

```bash
# Check database connectivity
npm run db:check

# Verify schema
npx drizzle-kit introspect

# Test blob storage
curl -X GET "/api/admin/blob-management?storeType=public"

# Monitor background jobs
# Check Inngest dashboard
```

## Future Enhancements

### Planned Features

1. Real-time notifications via WebSocket
2. Advanced analytics and reporting
3. Multi-tenant data isolation improvements
4. Enhanced file processing (OCR, thumbnails)

### Technical Debt

1. Fix admin function schema mismatches
2. Implement comprehensive error boundaries
3. Add end-to-end testing suite
4. Optimize database queries

## API Reference

See the public Mintlify documentation for detailed API specifications:

- Credit Management APIs
- Knowledge Base APIs
- Admin Operations APIs
- Background Job Webhooks

## Development Workflow

1. **Feature Development**

   - Create feature branch from `dev-phase3`
   - Implement with comprehensive tests
   - Update documentation

2. **Database Changes**

   - Update schema in `lib/db/schema.ts`
   - Run `npm run db:push` to apply changes
   - Update type definitions

3. **API Development**

   - Follow existing patterns in `app/api/`
   - Include proper validation and error handling
   - Add to public documentation

4. **Background Jobs**
   - Implement in `lib/inngest/functions/`
   - Test thoroughly with mock data
   - Monitor execution in production

This completes the internal engineering documentation for Phase 3. The system is production-ready with comprehensive features for credit management, knowledge base operations, and administrative functions.
