# Production Deployment Guide

This comprehensive guide covers deploying DeelRx CRM to production using Vercel, including environment setup, configuration, monitoring, and best practices for a scalable, secure deployment.

## 🎯 Deployment Overview

DeelRx CRM is optimized for deployment on **Vercel** with the following architecture:
- **Frontend**: Next.js 15 application with App Router
- **Backend**: Serverless API functions
- **Database**: Neon PostgreSQL with connection pooling
- **File Storage**: Vercel Blob for secure file uploads
- **Authentication**: NextAuth.js with multiple providers
- **Monitoring**: Built-in logging and performance tracking

### Prerequisites

Before beginning deployment, ensure you have:
- **Vercel Account**: Pro plan recommended for production
- **Domain Name**: Custom domain for your organization
- **Database**: Neon PostgreSQL instance (or compatible)
- **Environment Variables**: All required configuration values
- **SSL Certificates**: Managed automatically by Vercel

## 🚀 Step 1: Vercel Project Setup

### Initial Project Configuration

1. **Connect Repository**
   ```bash
   # Option 1: Using Vercel CLI
   npm install -g vercel
   vercel login
   vercel --prod
   
   # Option 2: Via Vercel Dashboard
   # 1. Go to vercel.com/dashboard
   # 2. Click "Add New Project"
   # 3. Import from GitHub/GitLab/Bitbucket
   # 4. Select deelrxcrm-vercel repository
   ```

2. **Project Settings**
   ```
   Project Name: deelrxcrm-production
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next (auto-detected)
   Install Command: npm install
   Development Command: npm run dev
   ```

3. **Environment Configuration**
   ```
   Node.js Version: 20.x (latest LTS)
   Region: Washington, D.C. (iad1) - or closest to users
   Functions Region: Washington, D.C. (iad1)
   Edge Network: Global (automatic)
   ```

### Domain Configuration

1. **Custom Domain Setup**
   ```bash
   # Add custom domain via CLI
   vercel domains add deelrxcrm.app
   vercel domains add www.deelrxcrm.app
   
   # Configure DNS records
   # A record: @ -> 76.76.19.61 (Vercel IP)
   # CNAME record: www -> cname.vercel-dns.com
   ```

2. **SSL Configuration**
   - SSL certificates are automatically managed by Vercel
   - HTTPS is enforced by default
   - HTTP requests are automatically redirected to HTTPS

3. **Domain Verification**
   ```bash
   # Verify domain ownership
   vercel domains verify deelrxcrm.app
   
   # Check DNS propagation
   dig deelrxcrm.app
   dig www.deelrxcrm.app
   ```

## 🔧 Step 2: Environment Variables Configuration

### Required Environment Variables

Create environment variables in Vercel Dashboard or via CLI:

```bash
# Database Configuration
vercel env add DATABASE_URL
# Value: postgresql://user:password@host:5432/database?sslmode=require

# Authentication
vercel env add NEXTAUTH_SECRET
# Value: [32+ character random string]

vercel env add NEXTAUTH_URL  
# Value: https://deelrxcrm.app

# OAuth Providers
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GITHUB_CLIENT_ID  
vercel env add GITHUB_CLIENT_SECRET

# Stripe Payment Processing
vercel env add STRIPE_SECRET_KEY
# Value: sk_live_... (production key)

vercel env add STRIPE_WEBHOOK_SECRET
# Value: whsec_... (production webhook secret)

# Email Service (Resend)
vercel env add RESEND_API_KEY
# Value: re_... (production API key)

# File Storage (automatically provided by Vercel)
# BLOB_READ_WRITE_TOKEN is auto-injected

# AI Services (optional)
vercel env add OPENAI_API_KEY
vercel env add ANTHROPIC_API_KEY

# Application Configuration
vercel env add NODE_ENV production
vercel env add CORS_ORIGIN https://deelrxcrm.app,https://www.deelrxcrm.app
```

### Environment Variable Management

1. **Environment-Specific Configuration**
   ```bash
   # Production environment
   vercel env add DATABASE_URL production
   
   # Preview environment (staging)
   vercel env add DATABASE_URL preview
   
   # Development environment
   vercel env add DATABASE_URL development
   ```

2. **Bulk Environment Setup**
   ```bash
   # Create .env.production file
   cat > .env.production << EOF
   DATABASE_URL=postgresql://...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=https://deelrxcrm.app
   # ... other variables
   EOF
   
   # Import all variables
   vercel env pull .env.production
   ```

### Environment Validation

Add to your deployment process:

```javascript
// scripts/validate-env.js
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET', 
  'NEXTAUTH_URL',
  'STRIPE_SECRET_KEY',
  'RESEND_API_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  process.exit(1);
}

console.log('✅ All required environment variables are set');
```

## 🗄️ Step 3: Database Setup

### Neon PostgreSQL Configuration

1. **Create Production Database**
   ```bash
   # Using Neon CLI
   npm install -g @neondatabase/cli
   neonctl auth
   neonctl projects create --name deelrxcrm-production
   
   # Or create via Neon Dashboard
   # 1. Go to console.neon.tech
   # 2. Click "Create Project"
   # 3. Name: deelrxcrm-production
   # 4. Region: US East (or closest to Vercel region)
   ```

2. **Connection String Configuration**
   ```
   Format: postgresql://[user]:[password]@[host]/[database]?sslmode=require
   
   Example:
   postgresql://user123:pass456@ep-cool-lab-123456.us-east-1.aws.neon.tech/deelrxcrm?sslmode=require
   ```

3. **Connection Pooling**
   ```sql
   -- Neon automatically provides connection pooling
   -- Verify connection limits in Neon dashboard
   -- Default: 100 connections for paid plans
   ```

### Database Migration

1. **Run Migrations**
   ```bash
   # Local migration to production DB
   DATABASE_URL="postgresql://..." npm run db:push
   
   # Or via Vercel build process
   # Add to vercel.json:
   {
     "buildCommand": "npm run build && npm run db:push"
   }
   ```

2. **Migration Verification**
   ```bash
   # Verify schema
   npm run db:studio
   
   # Check tables exist
   psql $DATABASE_URL -c "\dt"
   ```

## 📦 Step 4: Build Configuration

### Optimize Build Settings

1. **Next.js Configuration** (`next.config.ts`)
   ```typescript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     // Production optimizations
     reactStrictMode: true,
     swcMinify: true,
     
     // Image optimization
     images: {
       formats: ['image/webp', 'image/avif'],
       minimumCacheTTL: 31536000, // 1 year
     },
     
     // Security headers
     async headers() {
       return [
         {
           source: '/:path*',
           headers: [
             {
               key: 'X-Frame-Options',
               value: 'DENY',
             },
             {
               key: 'X-Content-Type-Options', 
               value: 'nosniff',
             },
             {
               key: 'Referrer-Policy',
               value: 'strict-origin-when-cross-origin',
             },
           ],
         },
       ];
     },
     
     // Performance optimizations
     experimental: {
       optimizePackageImports: ['@radix-ui/react-icons'],
     },
   };
   
   export default nextConfig;
   ```

2. **Vercel Configuration** (`vercel.json`)
   ```json
   {
     "buildCommand": "npm run deploy:build",
     "framework": "nextjs",
     "regions": ["iad1", "fra1", "sfo1"],
     "functions": {
       "app/api/**/*.ts": {
         "maxDuration": 30
       }
     },
     "headers": [
       {
         "source": "/api/(.*)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=300, s-maxage=3600"
           }
         ]
       },
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "X-Frame-Options",
             "value": "DENY"
           }
         ]
       }
     ],
     "redirects": [
       {
         "source": "/admin",
         "destination": "/dashboard/admin",
         "permanent": true
       }
     ]
   }
   ```

### Build Optimization

1. **Package.json Scripts**
   ```json
   {
     "scripts": {
       "deploy:validate": "node scripts/validate-env.js",
       "deploy:optimize": "node scripts/build-optimization.js",
       "deploy:build": "npm run deploy:validate && next build",
       "deploy:health": "node scripts/health-check.js"
     }
   }
   ```

2. **Build Performance Monitoring**
   ```javascript
   // scripts/build-stats.js
   const { execSync } = require('child_process');
   const fs = require('fs');
   
   console.log('📊 Build Performance Analysis');
   
   // Analyze bundle size
   const bundleAnalyzer = execSync('npx @next/bundle-analyzer', { 
     encoding: 'utf8' 
   });
   
   // Check build time
   const startTime = Date.now();
   execSync('next build');
   const buildTime = Date.now() - startTime;
   
   console.log(`⏱️  Build completed in ${buildTime}ms`);
   ```

## 🔍 Step 5: Monitoring and Logging

### Vercel Analytics Integration

1. **Enable Analytics**
   ```bash
   # Install Vercel Analytics
   npm install @vercel/analytics
   
   # Add to app layout
   # app/layout.tsx
   import { Analytics } from '@vercel/analytics/react';
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Analytics />
         </body>
       </html>
     );
   }
   ```

2. **Speed Insights**
   ```bash
   npm install @vercel/speed-insights
   
   # Add to layout
   import { SpeedInsights } from '@vercel/speed-insights/next';
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <SpeedInsights />
         </body>
       </html>
     );
   }
   ```

### Production Logging

1. **Structured Logging** (Already implemented in `lib/monitoring/production.ts`)
   ```typescript
   import { ProductionLogger } from '@/lib/monitoring/production';
   
   const logger = new ProductionLogger();
   
   // In API routes
   export async function POST(request: Request) {
     const requestId = crypto.randomUUID();
     logger.info('API request started', { 
       requestId, 
       path: request.url 
     });
     
     try {
       // API logic
       logger.info('API request completed', { requestId });
     } catch (error) {
       logger.error('API request failed', { requestId, error });
     }
   }
   ```

2. **Error Tracking Integration**
   ```bash
   # Optional: Add Sentry for advanced error tracking
   npm install @sentry/nextjs
   
   # Configure sentry.client.config.ts
   import * as Sentry from '@sentry/nextjs';
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 0.1,
   });
   ```

### Health Check Endpoints

1. **Health Check API** (`app/api/health/route.ts`)
   ```typescript
   import { NextResponse } from 'next/server';
   import { getDb } from '@/server/db';
   
   export async function GET() {
     try {
       // Database connectivity check
       const db = getDb();
       await db.execute('SELECT 1');
       
       // Additional health checks
       const checks = {
         database: 'healthy',
         timestamp: new Date().toISOString(),
         version: process.env.npm_package_version,
         environment: process.env.NODE_ENV,
       };
       
       return NextResponse.json(checks, { status: 200 });
     } catch (error) {
       return NextResponse.json(
         { status: 'unhealthy', error: error.message },
         { status: 503 }
       );
     }
   }
   ```

2. **External Monitoring**
   ```bash
   # Set up external monitoring (UptimeRobot, Pingdom, etc.)
   # Monitor these endpoints:
   # https://deelrxcrm.app/api/health
   # https://deelrxcrm.app/api/status
   # https://deelrxcrm.app/ (homepage)
   ```

## 🔒 Step 6: Security Configuration

### Security Headers

1. **Content Security Policy**
   ```typescript
   // next.config.ts
   const securityHeaders = [
     {
       key: 'Content-Security-Policy',
       value: [
         "default-src 'self'",
         "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
         "style-src 'self' 'unsafe-inline'",
         "img-src 'self' data: https:",
         "font-src 'self'",
         "connect-src 'self' https://api.stripe.com",
       ].join('; '),
     },
   ];
   ```

2. **CORS Configuration**
   ```typescript
   // middleware.ts
   import { NextResponse } from 'next/server';
   
   export function middleware(request: Request) {
     const response = NextResponse.next();
     
     const origin = request.headers.get('origin');
     const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
     
     if (allowedOrigins.includes(origin)) {
       response.headers.set('Access-Control-Allow-Origin', origin);
     }
     
     return response;
   }
   ```

### Authentication Security

1. **Session Configuration**
   ```typescript
   // app/api/auth/[...nextauth]/route.ts
   export const authOptions: NextAuthOptions = {
     session: {
       strategy: 'jwt',
       maxAge: 24 * 60 * 60, // 24 hours
     },
     jwt: {
       maxAge: 24 * 60 * 60, // 24 hours
     },
     cookies: {
       sessionToken: {
         name: 'next-auth.session-token',
         options: {
           httpOnly: true,
           sameSite: 'lax',
           path: '/',
           secure: true, // HTTPS only in production
         },
       },
     },
   };
   ```

## 🌐 Step 7: CDN and Performance

### Edge Configuration

1. **Static Asset Optimization**
   ```json
   // vercel.json
   {
     "headers": [
       {
         "source": "/static/(.*)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=31536000, immutable"
           }
         ]
       },
       {
         "source": "/_next/static/(.*)",
         "headers": [
           {
             "key": "Cache-Control", 
             "value": "public, max-age=31536000, immutable"
           }
         ]
       }
     ]
   }
   ```

2. **Image Optimization**
   ```typescript
   // next.config.ts
   const nextConfig = {
     images: {
       formats: ['image/webp', 'image/avif'],
       deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
       imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
       minimumCacheTTL: 31536000, // 1 year
     },
   };
   ```

## 🚢 Step 8: Deployment Process

### Automated Deployment

1. **GitHub Actions** (`.github/workflows/deploy.yml`)
   ```yaml
   name: Deploy to Vercel
   
   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         
         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'
             
         - name: Install dependencies
           run: npm ci
           
         - name: Run tests
           run: npm test
           
         - name: Build application
           run: npm run build
           
         - name: Deploy to Vercel
           uses: vercel/action@v1
           with:
             vercel-token: ${{ secrets.VERCEL_TOKEN }}
             vercel-org-id: ${{ secrets.ORG_ID }}
             vercel-project-id: ${{ secrets.PROJECT_ID }}
   ```

2. **Manual Deployment**
   ```bash
   # Production deployment
   vercel --prod
   
   # Preview deployment (staging)
   vercel
   
   # Deploy specific branch
   git checkout feature-branch
   vercel
   ```

### Deployment Verification

1. **Post-Deployment Checks**
   ```bash
   #!/bin/bash
   # scripts/post-deploy-check.sh
   
   echo "🚀 Running post-deployment verification..."
   
   # Health check
   curl -f https://deelrxcrm.app/api/health || exit 1
   
   # Database connectivity
   curl -f https://deelrxcrm.app/api/status || exit 1
   
   # Authentication endpoints
   curl -f https://deelrxcrm.app/api/auth/session || exit 1
   
   # Static assets
   curl -f https://deelrxcrm.app/_next/static/css/app.css || exit 1
   
   echo "✅ All checks passed!"
   ```

2. **Performance Validation**
   ```bash
   # Lighthouse CI integration
   npm install -g @lhci/cli
   
   lhci autorun --upload.target=temporary-public-storage
   ```

## 📊 Step 9: Production Monitoring

### Key Metrics to Monitor

1. **Application Performance**
   ```
   Response Time Targets:
   - API endpoints: < 500ms (95th percentile)
   - Page loads: < 3 seconds (95th percentile)
   - Database queries: < 100ms (95th percentile)
   ```

2. **Error Rates**
   ```
   Error Rate Targets:
   - API errors: < 1%
   - Client errors: < 5%
   - Database errors: < 0.1%
   ```

3. **Resource Usage**
   ```
   - Function duration: < 25 seconds (Vercel limit: 30s)
   - Memory usage: < 1GB (Vercel default limit)
   - Database connections: < 80% of pool size
   ```

### Alerting Configuration

1. **Vercel Monitoring**
   ```bash
   # Configure alerts in Vercel Dashboard:
   # 1. Go to Project Settings → Monitoring
   # 2. Set up alerts for:
   #    - Function errors > 5%
   #    - Function duration > 20 seconds
   #    - Build failures
   #    - Domain issues
   ```

2. **Custom Alerting**
   ```typescript
   // lib/monitoring/alerts.ts
   export const sendAlert = async (metric: string, value: number, threshold: number) => {
     if (value > threshold) {
       // Send to Slack, email, or monitoring service
       await fetch(process.env.SLACK_WEBHOOK_URL, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           text: `🚨 Alert: ${metric} is ${value}, exceeding threshold of ${threshold}`,
         }),
       });
     }
   };
   ```

## 🔄 Step 10: Maintenance and Updates

### Regular Maintenance Tasks

1. **Daily Tasks**
   ```bash
   # Monitor error logs
   vercel logs --follow
   
   # Check performance metrics
   # Review Vercel Analytics dashboard
   
   # Verify backup completion
   # Check database backup status
   ```

2. **Weekly Tasks**
   ```bash
   # Security updates
   npm audit
   npm update
   
   # Performance review
   # Analyze Lighthouse scores
   # Review bundle size changes
   
   # Database maintenance
   # Check query performance
   # Review connection pool usage
   ```

3. **Monthly Tasks**
   ```bash
   # Dependency updates
   npm outdated
   npx npm-check-updates
   
   # Security review
   # Review access logs
   # Update security policies
   
   # Performance optimization
   # Analyze Core Web Vitals
   # Optimize slow queries
   ```

### Update Process

1. **Staging Deployment**
   ```bash
   # Deploy to preview environment
   git checkout staging
   vercel
   
   # Run integration tests
   npm run test:e2e
   
   # Performance testing
   npm run test:performance
   ```

2. **Production Deployment**
   ```bash
   # Merge to main branch
   git checkout main
   git merge staging
   
   # Deploy to production
   vercel --prod
   
   # Post-deployment verification
   npm run deploy:health
   ```

## 🎯 Production Checklist

### Pre-Launch Verification
```
✅ Environment variables configured
✅ Database connected and migrated
✅ Domain configured with SSL
✅ Authentication providers set up
✅ Payment processing configured
✅ Email service connected
✅ File storage configured
✅ Monitoring and logging active
✅ Security headers implemented
✅ Performance optimized
✅ Backup systems operational
✅ Health checks responding
✅ Error tracking configured
✅ CDN and caching optimized
```

### Performance Benchmarks
```
✅ Lighthouse Score > 90
✅ First Contentful Paint < 1.5s
✅ Largest Contentful Paint < 2.5s
✅ Cumulative Layout Shift < 0.1
✅ First Input Delay < 100ms
✅ API Response Time < 500ms
✅ Database Query Time < 100ms
```

### Security Verification  
```
✅ HTTPS enforced
✅ Security headers configured
✅ Authentication secured
✅ Database access restricted
✅ API rate limiting active
✅ Input validation implemented
✅ CORS policies configured
✅ Sensitive data encrypted
```

## 🎉 Deployment Complete!

Your DeelRx CRM is now successfully deployed to production! The system is configured for:

- **High Performance**: Sub-second response times with global CDN
- **Scalability**: Serverless architecture that scales automatically
- **Security**: Enterprise-grade security with multiple layers of protection
- **Reliability**: 99.9% uptime with automatic failover and recovery
- **Monitoring**: Comprehensive observability and alerting

### Next Steps

1. **User Onboarding**: Begin user migration and training
2. **Data Migration**: Import existing customer data if applicable
3. **Integration Setup**: Configure third-party integrations
4. **Team Training**: Conduct admin and user training sessions
5. **Go-Live Communication**: Announce launch to your organization

### Support Resources

- **Production Support**: [support@deelrxcrm.app](mailto:support@deelrxcrm.app)
- **Status Page**: [status.deelrxcrm.app](https://status.deelrxcrm.app)
- **Documentation**: [docs.deelrxcrm.app](https://docs.deelrxcrm.app)
- **Emergency Contact**: Available 24/7 for critical issues

---

**Congratulations on your successful production deployment!** 🚀

*Last updated: December 2024*