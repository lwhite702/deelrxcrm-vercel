# Vercel Deployment Guide

Deploy DeelRxCRM as a Next.js App Router application on Vercel with Neon Postgres.

## Prerequisites

- GitHub account with repository access
- Vercel account
- Neon Postgres database
- Clerk authentication setup
- Stripe account (for payments)

## Deployment Steps

### 1. Repository Setup

1. Fork the repository to your GitHub account
2. Ensure all local changes are committed and pushed

### 2. Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your forked repository
4. Select framework preset: **Next.js**
5. Configure project settings:
   - **Root Directory**: Leave default (repository root)
   - **Build and Output Settings**: Use defaults

### 3. Environment Variables

Add these in Vercel Project Settings → Environment Variables (apply to Production, Preview, and Development):

#### Required Variables

```bash
# Application
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app

# Database
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://username:password@host:port/database?sslmode=require

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup

# Stripe Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### Optional Variables

```bash
# Super Admin Access
NEXT_PUBLIC_SUPER_ADMIN_USER_IDS=user_123,user_456

# CORS (if needed)
CORS_ORIGIN=https://your-domain.vercel.app
```

**Note**: Vercel automatically provides `BLOB_READ_WRITE_TOKEN` at runtime.

### 4. Database Migration

Run database migrations to set up the schema:

```bash
# Local setup first
cp .env.example .env
# Fill in your DATABASE_URL

# Apply migrations
npm install
npm run db:push
```

For production, consider setting up GitHub Actions for automated migrations.

### 5. Configure External Services

#### Clerk Webhooks

1. In Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/clerk/webhooks`
3. Copy signing secret to `CLERK_WEBHOOK_SECRET`

#### Stripe Webhooks

1. In Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Select events: `payment_intent.*`, `customer.*`, `invoice.*`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### 6. Domain Configuration

1. In Vercel Project → Settings → Domains
2. Add your custom domain (optional)
3. Update `NEXT_PUBLIC_SITE_URL` if using custom domain

### 7. Deploy and Test

1. Trigger deployment by pushing to main branch
2. Monitor build logs in Vercel dashboard
3. Once deployed, run smoke tests (see SMOKE_TEST.md)

## Build Configuration

### Package Scripts Used

- **Install**: `npm install`
- **Build**: `npm run build:next`
- **Start**: `npm run start:next`

### Next.js Configuration

The app uses these Next.js features:

- App Router (stable)
- API Routes as route handlers
- Server Components and Client Components
- Static and dynamic rendering

## Troubleshooting

### Common Issues

**Build Failures**

- Check environment variables are set correctly
- Verify all dependencies are in package.json
- Review build logs for specific error messages

**Database Connection Errors**

- Ensure `DATABASE_URL` includes `?sslmode=require`
- Verify Neon database is accessible from Vercel
- Check that database schema is up to date

**Authentication Issues**

- Confirm Clerk keys are for the correct environment (live vs test)
- Verify webhook endpoints are accessible
- Check CORS settings if needed

**Stripe Integration Problems**

- Use live keys for production deployment
- Verify webhook signing secrets match
- Test webhook endpoints are publicly accessible

### Performance Optimization

**Recommended Settings**

- Enable Edge Runtime where possible
- Use dynamic imports for large components
- Implement proper caching strategies
- Monitor Core Web Vitals in Vercel Analytics

**Database Optimization**

- Use connection pooling via Neon
- Implement proper indexing strategies
- Monitor query performance
- Consider read replicas for high traffic

## Security Checklist

- [ ] All environment variables use production values
- [ ] Database connection uses SSL (`sslmode=require`)
- [ ] Webhook endpoints verify signatures
- [ ] Super admin access is restricted
- [ ] CORS origins are properly configured
- [ ] Rate limiting is implemented where needed

## Monitoring and Maintenance

**Vercel Features**

- Enable Web Analytics
- Set up deployment notifications
- Monitor function execution logs
- Track Core Web Vitals

**External Monitoring**

- Set up database performance monitoring in Neon
- Configure Stripe webhook monitoring
- Implement error tracking (e.g., Sentry)
- Monitor uptime and performance
