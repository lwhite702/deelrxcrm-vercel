# Development Setup Guide

This guide will help you set up a local development environment for contributing to DeelRx CRM. Follow these steps to get your development environment running quickly and efficiently.

## 🎯 Development Overview

DeelRx CRM is built with modern web technologies:
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS with shadcn/ui
- **Testing**: Jest, Playwright, and Vitest
- **Package Manager**: npm (recommended)

### Architecture Quick Reference
```
deelrxcrm-vercel/
├── app/                    # Next.js App Router pages and API routes
├── components/             # Reusable React components  
├── lib/                   # Shared utilities and configurations
├── server/                # Server-side code and database logic
├── docs/                  # Documentation
├── scripts/               # Build and utility scripts
├── public/                # Static assets
└── drizzle/              # Database migrations
```

## 📋 Prerequisites

Before starting, ensure you have:

### Required Software
- **Node.js**: Version 20.x or later ([Download](https://nodejs.org/))
- **npm**: Version 9.x or later (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **Code Editor**: VS Code recommended with extensions

### Recommended VS Code Extensions
```
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Hero
- Prettier - Code formatter
- ESLint
- GitLens
- Auto Rename Tag
- Bracket Pair Colorizer
- Thunder Client (for API testing)
```

### Database Options
Choose one of these database options:

**Option 1: Neon (Recommended)**
- Free tier available
- PostgreSQL-compatible
- No local setup required

**Option 2: Local PostgreSQL**
- Full control over database
- Works offline
- Requires local installation

**Option 3: Docker PostgreSQL** 
- Containerized setup
- Easy to reset/recreate
- Requires Docker installation

## 🚀 Step 1: Repository Setup

### Clone Repository
```bash
# Clone the repository
git clone https://github.com/your-org/deelrxcrm-vercel.git
cd deelrxcrm-vercel

# Or fork first (recommended for contributions)
# 1. Fork repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/deelrxcrm-vercel.git
cd deelrxcrm-vercel

# Add upstream remote
git remote add upstream https://github.com/your-org/deelrxcrm-vercel.git
```

### Install Dependencies
```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

### Verify Node.js Setup
```bash
# Check versions
node --version  # Should be 20.x or later
npm --version   # Should be 9.x or later

# Check npm configuration
npm config list
```

## 🗄️ Step 2: Database Setup

### Option A: Neon Database (Recommended)

1. **Create Neon Account**
   - Go to [console.neon.tech](https://console.neon.tech)
   - Sign up with GitHub (recommended)
   - Create a new project: `deelrxcrm-dev`

2. **Get Connection String**
   ```bash
   # Copy connection string from Neon dashboard
   # Format: postgresql://user:pass@host/database?sslmode=require
   ```

3. **Test Connection**
   ```bash
   # Test database connectivity
   psql "postgresql://user:pass@host/database?sslmode=require" -c "SELECT version();"
   ```

### Option B: Local PostgreSQL

1. **Install PostgreSQL**
   ```bash
   # macOS (using Homebrew)
   brew install postgresql@15
   brew services start postgresql@15
   
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create Database**
   ```bash
   # Create user and database
   sudo -u postgres psql
   
   CREATE USER deelrx WITH PASSWORD 'dev_password';
   CREATE DATABASE deelrxcrm_dev OWNER deelrx;
   GRANT ALL PRIVILEGES ON DATABASE deelrxcrm_dev TO deelrx;
   \q
   ```

3. **Connection String**
   ```bash
   # Local connection string
   DATABASE_URL="postgresql://deelrx:dev_password@localhost:5432/deelrxcrm_dev"
   ```

### Option C: Docker PostgreSQL

1. **Create Docker Compose File**
   ```yaml
   # docker-compose.dev.yml
   version: '3.8'
   services:
     postgres:
       image: postgres:15
       environment:
         POSTGRES_DB: deelrxcrm_dev
         POSTGRES_USER: deelrx  
         POSTGRES_PASSWORD: dev_password
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

2. **Start Database**
   ```bash
   # Start PostgreSQL container
   docker-compose -f docker-compose.dev.yml up -d
   
   # Verify it's running
   docker-compose -f docker-compose.dev.yml ps
   ```

## ⚙️ Step 3: Environment Configuration

### Create Environment File
```bash
# Copy example environment file
cp .env.example .env.local

# Or create manually
touch .env.local
```

### Configure Environment Variables
```bash
# .env.local
# Database
DATABASE_URL="postgresql://user:pass@host/database?sslmode=require"

# Authentication (generate random secrets)
NEXTAUTH_SECRET="your-32-character-random-string-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optional for basic development)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Stripe (optional - use test keys)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (optional - use Resend test key)
RESEND_API_KEY="re_..."

# AI Services (optional) 
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Development settings
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

### Generate Secrets
```bash
# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use online generator
# https://generate-secret.vercel.app/32
```

## 🔧 Step 4: Database Migration

### Run Database Migrations
```bash
# Push schema to database
npm run db:push

# Verify tables were created
npm run db:studio
# This opens Drizzle Studio at http://localhost:4983
```

### Seed Development Data (Optional)
```bash
# Run database seeder
npm run db:seed

# Or create custom seed script
node scripts/seed-dev-data.js
```

### Database Management Commands
```bash
# View current schema
npm run db:introspect

# Generate migrations (if schema changes)
npm run db:generate

# Reset database (careful!)
npm run db:reset
```

## 🏃‍♂️ Step 5: Start Development Server

### Start the Application
```bash
# Start development server
npm run dev

# Server will start at:
# http://localhost:3000
```

### Verify Everything Works
```bash
# Check these URLs in your browser:
# http://localhost:3000          - Homepage
# http://localhost:3000/login    - Login page
# http://localhost:3000/api/health - Health check API
```

### Development Scripts
```bash
# Start development server
npm run dev

# Build for production (test)
npm run build

# Start production server locally
npm start

# Run tests
npm test

# Run type checking
npm run type-check

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## 🧪 Step 6: Testing Setup

### Test Environment Setup
```bash
# Install test dependencies (should be included)
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Create test database
createdb deelrxcrm_test

# Set test environment variables
cat > .env.test << EOF
DATABASE_URL="postgresql://user:pass@host/deelrxcrm_test"
NEXTAUTH_SECRET="test-secret-32-characters-long"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="test"
EOF
```

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- components/ContactForm.test.tsx

# Run E2E tests (Playwright)
npm run test:e2e
```

### Test Database Management
```bash
# Reset test database before tests
npm run test:db:reset

# Seed test data
npm run test:db:seed
```

## 🔍 Step 7: Development Workflow

### Daily Development Workflow

1. **Start Your Day**
   ```bash
   # Pull latest changes
   git pull upstream main
   
   # Update dependencies (if needed)
   npm install
   
   # Start dev server
   npm run dev
   ```

2. **Before Making Changes**
   ```bash
   # Create feature branch
   git checkout -b feature/your-feature-name
   
   # Run tests to ensure everything works
   npm test
   ```

3. **During Development**
   ```bash
   # Run tests for specific files you're changing
   npm test -- --watch components/YourComponent.test.tsx
   
   # Check types periodically
   npm run type-check
   
   # Format code
   npm run format
   ```

4. **Before Committing**
   ```bash
   # Run full test suite
   npm test
   
   # Run linting
   npm run lint
   
   # Type check
   npm run type-check
   
   # Build to ensure no build errors
   npm run build
   ```

### Code Quality Tools

**ESLint Configuration** (`.eslintrc.json`)
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error"
  }
}
```

**Prettier Configuration** (`.prettierrc`)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80, 
  "tabWidth": 2
}
```

## 🛠️ Step 8: Development Tools

### Database Tools

**Drizzle Studio**
```bash
# Open database browser
npm run db:studio
# Access at http://localhost:4983
```

**Database CLI Access**
```bash
# Connect to development database
psql $DATABASE_URL

# Common commands:
# \dt              - List tables
# \d table_name    - Describe table
# \q               - Quit
```

### API Testing

**Built-in API Routes**
```bash
# Health check
curl http://localhost:3000/api/health

# Authentication status
curl http://localhost:3000/api/auth/session

# Protected API example
curl -H "Authorization: Bearer token" http://localhost:3000/api/contacts
```

**Thunder Client (VS Code)**
- Install Thunder Client extension
- Create API collection for DeelRx CRM
- Test all API endpoints locally

### Debugging Tools

**VS Code Debug Configuration** (`.vscode/launch.json`)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Next.js: debug client-side", 
      "type": "pwa-chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

**Debug Mode**
```bash
# Start with debugging enabled
NODE_OPTIONS='--inspect' npm run dev

# Then attach VS Code debugger
```

## 📱 Step 9: Mobile Development

### Testing Mobile Views
```bash
# Start dev server with network access
npm run dev -- --hostname 0.0.0.0

# Access from mobile device on same network
# http://YOUR_IP_ADDRESS:3000
```

### Mobile Debugging
```bash
# Install mobile debugging tools
npm install --save-dev @playwright/test

# Configure mobile viewports in tests
# tests/mobile.spec.ts
```

## 🔄 Step 10: Git Workflow

### Branch Naming Convention
```bash
# Feature branches
git checkout -b feature/contact-management-ui
git checkout -b feature/deal-pipeline-api

# Bug fixes
git checkout -b fix/login-redirect-issue
git checkout -b fix/database-connection-pool

# Documentation
git checkout -b docs/api-documentation
git checkout -b docs/setup-guide
```

### Commit Message Format
```bash
# Format: type(scope): description
git commit -m "feat(contacts): add contact creation form"
git commit -m "fix(auth): resolve login redirect loop"
git commit -m "docs(api): update endpoint documentation"
git commit -m "test(deals): add deal pipeline tests"
```

### Pull Request Process
```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes and commit
git add .
git commit -m "feat: implement your feature"

# 3. Push to your fork
git push origin feature/your-feature

# 4. Create PR via GitHub interface
# 5. Address code review feedback
# 6. Merge when approved
```

## 🎛️ Step 11: Advanced Development

### Custom Environment Setup

**Multiple Database Environments**
```bash
# .env.local (primary development)
DATABASE_URL="postgresql://user:pass@host/deelrxcrm_dev"

# .env.test.local (testing)
DATABASE_URL="postgresql://user:pass@host/deelrxcrm_test"

# .env.staging.local (staging tests)
DATABASE_URL="postgresql://user:pass@host/deelrxcrm_staging"
```

**Environment Switching**
```bash
# Switch to test environment
cp .env.test.local .env.local
npm run db:push

# Switch back to development
cp .env.development.local .env.local
npm run db:push
```

### Performance Profiling

**Bundle Analysis**
```bash
# Analyze bundle size
npm run analyze

# Monitor bundle size changes
npm install --save-dev @next/bundle-analyzer
```

**Performance Monitoring**
```bash
# Enable performance monitoring in development
# Add to next.config.ts:
experimental: {
  instrumentationHook: true,
}
```

### Custom Scripts

**Package.json Development Scripts**
```json
{
  "scripts": {
    "dev:debug": "NODE_OPTIONS='--inspect' next dev",
    "dev:turbo": "next dev --turbo",
    "db:reset": "drizzle-kit drop && npm run db:push && npm run db:seed",
    "test:unit": "jest --passWithNoTests",
    "test:integration": "jest --config jest.integration.config.js",
    "type-check:watch": "tsc --noEmit --watch",
    "lint:staged": "lint-staged"
  }
}
```

## 🚨 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

**Database Connection Issues**
```bash
# Test database connection
node -e "
const { Client } = require('pg');
const client = new Client('$DATABASE_URL');
client.connect().then(() => {
  console.log('✅ Database connected successfully');
  client.end();
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
});
"
```

**Module Resolution Issues**
```bash
# Clear Next.js cache
rm -rf .next

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**TypeScript Errors**
```bash
# Check TypeScript configuration
npx tsc --showConfig

# Run type checking
npm run type-check

# Generate types for database
npm run db:generate
```

### Environment Issues

**Missing Environment Variables**
```bash
# Validate environment setup
node scripts/validate-env.js

# List all environment variables
printenv | grep -E "(DATABASE|NEXTAUTH|STRIPE)"
```

**SSL Certificate Issues (macOS)**
```bash
# Trust localhost SSL certificates
brew install mkcert
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

### Performance Issues

**Slow Development Server**
```bash
# Enable turbo mode (experimental)
npm run dev:turbo

# Disable source maps (faster builds)
# Add to next.config.ts:
productionBrowserSourceMaps: false,
```

**Memory Issues**
```bash
# Increase Node.js memory limit
NODE_OPTIONS='--max-old-space-size=4096' npm run dev
```

## 📚 Learning Resources

### Documentation
- **Next.js 15**: [nextjs.org/docs](https://nextjs.org/docs)
- **Drizzle ORM**: [orm.drizzle.team](https://orm.drizzle.team)
- **NextAuth.js**: [next-auth.js.org](https://next-auth.js.org)
- **Tailwind CSS**: [tailwindcss.com/docs](https://tailwindcss.com/docs)
- **shadcn/ui**: [ui.shadcn.com](https://ui.shadcn.com)

### Video Tutorials
- Next.js 15 App Router tutorials
- TypeScript best practices
- Database design with Drizzle
- React component patterns

### Community
- **Discord**: Join the DeelRx CRM developer community
- **GitHub Discussions**: Ask questions and share ideas
- **Stack Overflow**: Tag questions with `deelrx-crm`

## ✅ Development Setup Checklist

### Initial Setup
```
✅ Node.js 20.x installed
✅ Repository cloned and dependencies installed
✅ Database connected (Neon/Local/Docker)
✅ Environment variables configured
✅ Database migrated and seeded
✅ Development server running
✅ Health check API responding
```

### Development Tools
```
✅ VS Code with recommended extensions
✅ ESLint and Prettier configured
✅ Git hooks set up (optional)
✅ Database browser (Drizzle Studio) working
✅ API testing tool configured
✅ Debug configuration set up
```

### Testing Setup
```
✅ Test database configured
✅ Unit tests running
✅ Integration tests working
✅ E2E tests functional (optional)
✅ Test coverage reporting
```

## 🎉 You're Ready to Develop!

Your development environment is now fully configured! You can:

- **Browse the app** at [http://localhost:3000](http://localhost:3000)
- **Explore the database** with Drizzle Studio
- **Test APIs** with your preferred tool
- **Run tests** with `npm test`
- **Start building features** following the project structure

### Quick Start Commands
```bash
# Daily development workflow
npm run dev                 # Start development server
npm test                   # Run tests
npm run db:studio          # Open database browser
npm run type-check         # Check TypeScript
npm run lint              # Check code quality
```

### Next Steps
- Explore the codebase structure
- Read the [Architecture Overview](./architecture.md)
- Check out the [Contributing Guidelines](./contributing.md)
- Start with small bug fixes or documentation improvements

**Happy coding!** 🚀

---

**Need Help?**
- **GitHub Issues**: Report bugs or request features
- **Discord**: Join our developer community
- **Email**: [developers@deelrxcrm.app](mailto:developers@deelrxcrm.app)

*Last updated: December 2024*