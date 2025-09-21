# Environment Variables

This document outlines all environment variables required for DeelRxCRM.

## Required Variables

### Database

- `DATABASE_URL` - Neon Postgres connection string with SSL mode
- `DATABASE_URL_UNPOOLED` - Optional unpooled connection for Drizzle migrations

### Authentication (Clerk)

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key (pk*test*... or pk*live*...)
- `CLERK_SECRET_KEY` - Clerk secret key (sk*test*... or sk*live*...)
- `CLERK_WEBHOOK_SECRET` - Webhook signature secret (whsec\_...)

### Payments (Stripe)

- `STRIPE_SECRET_KEY` - Stripe secret key (sk*test*... or sk*live*...)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint secret (whsec\_...)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key (pk*test*... or pk*live*...)

### Application

- `NEXT_PUBLIC_SITE_URL` - Frontend URL (http://localhost:3000 or https://yourdomain.com)
- `APP_URL` - Same as NEXT_PUBLIC_SITE_URL
- `BASE_URL` - Same as NEXT_PUBLIC_SITE_URL

## Optional Variables

### File Storage

- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token (local dev only)

### Access Control

- `NEXT_PUBLIC_SUPER_ADMIN_USER_IDS` - Comma-separated Clerk user IDs for super admin access

### Security

- `CORS_ORIGIN` - Comma-separated allowed origins for API requests

### Performance (Optional)

- `UPSTASH_REDIS_REST_URL` - Redis URL for caching/rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - Redis authentication token

### MCP Services (Development)

- `CONTEXT7_API_KEY` - Context7 MCP service API key
- `GITHUB_MCP_PAT` - GitHub Personal Access Token for MCP
- `CODACY_ACCOUNT_TOKEN` - Codacy account token for code analysis

## Environment Setup

### Local Development

1. Copy `.env.example` to `.env`
2. Fill in the required values from your service providers
3. Ensure `DATABASE_URL` includes `?sslmode=require` for Neon

### Vercel Production

1. Add all required variables in Vercel Project Settings → Environment Variables
2. Vercel automatically provides `BLOB_READ_WRITE_TOKEN` at runtime
3. Use production keys (live*... instead of test*...)

## Security Notes

- Never commit actual environment values to git
- Use different keys for development and production
- Rotate webhook secrets periodically
- Keep super admin user IDs minimal and secure
