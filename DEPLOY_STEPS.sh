#!/bin/bash

# FILE: DEPLOY_STEPS.sh
# DeelRx CRM - Automated Deployment Script
# Deploys the street-pharmacy themed CRM with Asphalt + Neon design

set -e  # Exit on any error

echo "🚀 DeelRx CRM Deployment Script"
echo "================================"
echo "Theme: Asphalt + Neon"
echo "Target: Street-pharmacy businesses (legal use only)"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    log_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if this is the DeelRx CRM project
if ! grep -q "deelrxcrm-vercel" package.json; then
    log_error "This doesn't appear to be the DeelRx CRM project."
    exit 1
fi

log_info "Starting deployment process..."

# Step 1: Install dependencies
log_info "Installing dependencies..."
if command -v pnpm &> /dev/null; then
    log_info "Using pnpm..."
    pnpm install
elif command -v npm &> /dev/null; then
    log_info "Using npm..."
    npm install
else
    log_error "Neither npm nor pnpm found. Please install Node.js and npm."
    exit 1
fi
log_success "Dependencies installed"

# Step 2: Run build
log_info "Building Next.js application..."
if command -v pnpm &> /dev/null; then
    pnpm run build:next
else
    npm run build:next
fi

if [ $? -eq 0 ]; then
    log_success "Build completed successfully"
else
    log_error "Build failed. Please check the error messages above."
    exit 1
fi

# Step 3: Check if landing page was built correctly
if [ -d ".next/server/app/landing" ]; then
    log_success "Street-pharmacy landing page built successfully"
else
    log_warning "Landing page may not have been built correctly"
fi

# Step 4: Verify theme files
if grep -q "neon-lime" app/globals.css; then
    log_success "Asphalt + Neon theme detected in globals.css"
else
    log_warning "Theme may not be applied correctly"
fi

# Step 5: Check for legal disclaimer
if grep -q "illegal drug or controlled substance" app/landing/LandingClient.tsx; then
    log_success "Legal disclaimer found in landing page"
else
    log_error "Legal disclaimer missing from landing page - this is required!"
    exit 1
fi

# Step 6: Deploy to Vercel (if token is available)
if [ -n "$VERCEL_TOKEN" ]; then
    log_info "Vercel token found, attempting deployment..."
    
    # Check if vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        log_warning "Vercel CLI not found, installing..."
        npm install -g vercel
    fi
    
    # Link project if not already linked
    if [ ! -f ".vercel/project.json" ]; then
        log_info "Linking Vercel project..."
        vercel link --yes
    fi
    
    # Deploy to production
    log_info "Deploying to production..."
    vercel deploy --prod --token "$VERCEL_TOKEN"
    
    if [ $? -eq 0 ]; then
        log_success "Deployment completed successfully!"
        log_info "Your street-pharmacy CRM is now live!"
    else
        log_error "Deployment failed"
        exit 1
    fi
else
    log_warning "VERCEL_TOKEN not set. Manual deployment required."
    echo ""
    echo "Manual deployment steps:"
    echo "1. Install Vercel CLI: npm install -g vercel"
    echo "2. Login to Vercel: vercel login"
    echo "3. Link project: vercel link"
    echo "4. Deploy: vercel deploy --prod"
    echo ""
    echo "Or push to your connected GitHub repository for automatic deployment."
fi

# Step 7: Post-deployment checks
echo ""
log_info "Post-deployment verification checklist:"
echo "□ Landing page loads with dark Asphalt + Neon theme"
echo "□ Neon-lime primary buttons work correctly"
echo "□ Neon-cyan secondary elements display properly"
echo "□ Legal disclaimer visible in footer"
echo "□ 'Run the Block. Run the Business.' headline displays"
echo "□ All feature cards show urban theme styling"
echo "□ Mobile responsiveness works"
echo "□ Sign-up/demo buttons function correctly"

echo ""
log_success "Deployment script completed!"
echo ""
echo "🎉 DeelRx CRM - Street Edition is ready!"
echo "Theme: Asphalt + Neon (Dark mode with lime/cyan accents)"
echo "Target: Legal street-pharmacy businesses"
echo "⚖️  Remember: This system is for lawful business use only"
echo ""

# Environment variable checks
log_info "Environment variable checklist:"
if [ -z "$DATABASE_URL" ]; then
    echo "□ DATABASE_URL - Not set (required for production)"
else
    log_success "DATABASE_URL - Set"
fi

if [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ]; then
    echo "□ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY - Not set (required for auth)"
else
    log_success "CLERK keys - Set"
fi

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "□ STRIPE_SECRET_KEY - Not set (required for payments)"
else
    log_success "STRIPE keys - Set"
fi

echo ""
log_info "Next steps:"
echo "1. Configure all required environment variables in Vercel"
echo "2. Run database migrations: npm run db:push"
echo "3. Test the landing page: /landing"
echo "4. Verify legal disclaimer is prominent"
echo "5. Test sign-up and authentication flow"

exit 0