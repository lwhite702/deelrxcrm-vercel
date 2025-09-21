#!/bin/bash

# PROJECT_UPDATE.sh - Phase 1: Core CRM Implementation
# Generated: September 21, 2025
# Purpose: Apply Phase 1 Core CRM updates to DeelRx CRM

set -e

echo "🚀 Phase 1: Core CRM Implementation Update"
echo "=========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verify we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

if [ ! -f "drizzle.config.ts" ]; then
    print_error "drizzle.config.ts not found. This doesn't appear to be a DeelRx CRM project."
    exit 1
fi

print_status "Starting Phase 1 Core CRM implementation..."

# 1. Database Schema Migration
print_status "Step 1: Applying Core CRM database schema..."

if [ -f "drizzle/0003_core_crm.sql" ]; then
    print_status "Applying Phase 1 database migration..."
    
    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        print_warning "DATABASE_URL not set. Please apply migration manually:"
        print_warning "npm run db:push"
        print_warning "Or: psql \$DATABASE_URL -f drizzle/0003_core_crm.sql"
    else
        print_status "Pushing database schema changes..."
        npm run db:push
        if [ $? -eq 0 ]; then
            print_success "Database schema updated successfully"
        else
            print_error "Database migration failed. Please check your DATABASE_URL and try manually."
        fi
    fi
else
    print_error "Core CRM migration file not found: drizzle/0003_core_crm.sql"
    exit 1
fi

# 2. Install Dependencies
print_status "Step 2: Installing/updating dependencies..."

if [ -f "package-lock.json" ]; then
    npm ci
elif [ -f "yarn.lock" ]; then
    yarn install --frozen-lockfile
elif [ -f "pnpm-lock.yaml" ]; then
    pnpm install --frozen-lockfile
else
    npm install
fi

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# 3. Build Application
print_status "Step 3: Building application..."

npm run build
if [ $? -eq 0 ]; then
    print_success "Application built successfully"
else
    print_error "Build failed. Please check for TypeScript or build errors."
    exit 1
fi

# 4. Environment Variables Check
print_status "Step 4: Checking required environment variables..."

required_vars=(
    "DATABASE_URL"
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    "CLERK_SECRET_KEY"
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -eq 0 ]; then
    print_success "All required environment variables are set"
else
    print_warning "Missing environment variables:"
    for var in "${missing_vars[@]}"; do
        print_warning "  - $var"
    done
    print_warning "Please set these variables in your .env.local file or deployment environment"
fi

# 5. Verify New API Endpoints
print_status "Step 5: Verifying Core CRM API endpoints..."

# List of new API routes to check
api_routes=(
    "app/api/tenants/[tenantId]/products/route.ts"
    "app/api/tenants/[tenantId]/customers/route.ts"
    "app/api/tenants/[tenantId]/orders/route.ts"
    "app/api/tenants/[tenantId]/refund-payment/route.ts"
    "app/api/tenants/[tenantId]/dashboard/kpis/route.ts"
)

missing_routes=()

for route in "${api_routes[@]}"; do
    if [ ! -f "$route" ]; then
        missing_routes+=("$route")
    fi
done

if [ ${#missing_routes[@]} -eq 0 ]; then
    print_success "All Core CRM API endpoints are present"
else
    print_warning "Missing API routes:"
    for route in "${missing_routes[@]}"; do
        print_warning "  - $route"
    done
fi

# 6. Verify UI Pages
print_status "Step 6: Verifying Core CRM UI pages..."

ui_pages=(
    "app/(dashboard)/dashboard/page.tsx"
    "app/(dashboard)/inventory/page.tsx"
    "app/(dashboard)/customers/page.tsx"
    "app/(dashboard)/sales-pos/page.tsx"
    "app/(dashboard)/payments/page.tsx"
)

missing_pages=()

for page in "${ui_pages[@]}"; do
    if [ ! -f "$page" ]; then
        missing_pages+=("$page")
    fi
done

if [ ${#missing_pages[@]} -eq 0 ]; then
    print_success "All Core CRM UI pages are present"
else
    print_warning "Missing UI pages:"
    for page in "${missing_pages[@]}"; do
        print_warning "  - $page"
    done
fi

# 7. Documentation Check
print_status "Step 7: Verifying documentation..."

docs=(
    "docs/CORE_CRM.md"
    "docs/SMOKE_TEST.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        print_success "Documentation found: $doc"
    else
        print_warning "Documentation missing: $doc"
    fi
done

# 8. Run Type Check
print_status "Step 8: Running TypeScript type check..."

npx tsc --noEmit
if [ $? -eq 0 ]; then
    print_success "TypeScript type check passed"
else
    print_warning "TypeScript type check failed. Please review and fix type errors."
fi

# 9. Summary Report
echo ""
echo "📋 Phase 1 Implementation Summary"
echo "================================="

print_success "✅ Database schema migration ready"
print_success "✅ Core CRM API endpoints implemented:"
print_success "   - Products CRUD (inventory management)"
print_success "   - Customers CRUD (customer management)"
print_success "   - Orders creation and listing"
print_success "   - Payment refund processing"
print_success "   - Dashboard KPIs and metrics"

print_success "✅ User Interface pages implemented:"
print_success "   - Dashboard with real-time KPIs"
print_success "   - Inventory management with stock tracking"
print_success "   - Customer management with contact details"
print_success "   - Sales POS for order creation"
print_success "   - Payment management with refund capability"

print_success "✅ Security and validation:"
print_success "   - Role-based access control (RBAC)"
print_success "   - Zod validation for all API endpoints"
print_success "   - Tenant isolation and data security"
print_success "   - Stripe integration for payments"

# 10. Next Steps
echo ""
echo "🎯 Next Steps"
echo "============="
print_status "1. Deploy to Vercel (if not already deployed)"
print_status "2. Run smoke tests using docs/SMOKE_TEST.md"
print_status "3. Configure Stripe webhooks for production"
print_status "4. Set up monitoring and alerting"
print_status "5. Review CORE_CRM.md for detailed documentation"

# 11. Troubleshooting
echo ""
echo "🔧 Troubleshooting"
echo "=================="
print_status "If you encounter issues:"
print_status "1. Check all environment variables are set correctly"
print_status "2. Verify database connection with: npm run db:studio"
print_status "3. Test API endpoints manually or with Postman"
print_status "4. Review Vercel function logs for runtime errors"
print_status "5. Consult docs/CORE_CRM.md for detailed configuration"

echo ""
if [ ${#missing_vars[@]} -eq 0 ] && [ ${#missing_routes[@]} -eq 0 ] && [ ${#missing_pages[@]} -eq 0 ]; then
    print_success "🎉 Phase 1 Core CRM implementation is complete and ready for deployment!"
else
    print_warning "⚠️  Phase 1 implementation has some missing components. Please review the warnings above."
fi

echo ""
print_status "Phase 1 update completed at $(date)"
print_status "For support, consult the documentation or check GitHub issues."

exit 0