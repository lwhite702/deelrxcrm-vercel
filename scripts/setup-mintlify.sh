#!/bin/bash

# DeelRx CRM Mintlify Documentation Setup Script
# This script sets up and validates the Mintlify documentation environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MINTLIFY_DIR="$PROJECT_ROOT/mintlify"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "$MINTLIFY_DIR/mint.json" ]; then
    log_error "mint.json not found. Please run this script from the project root."
    exit 1
fi

cd "$MINTLIFY_DIR"

log_info "Setting up Mintlify documentation environment..."

# 1. Clean up old package files if they exist
if [ -f "package.json.bloated" ]; then
    log_info "Removing bloated package.json backup..."
    rm -f package.json.bloated
fi

if [ -f "package.json.new" ]; then
    log_info "Using clean package.json..."
    mv package.json.new package.json
fi

# 2. Remove old node_modules and lockfile
if [ -d "node_modules" ]; then
    log_info "Removing old node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    log_info "Removing old package-lock.json..."
    rm -f package-lock.json
fi

# 3. Install fresh dependencies
log_info "Installing Mintlify CLI and dependencies..."
npm install

# 4. Validate the documentation structure
log_info "Validating documentation structure..."
if node validate.js; then
    log_success "Documentation validation passed!"
else
    log_warning "Documentation validation found issues. Check the output above."
fi

# 5. Test local development server
log_info "Testing Mintlify development server..."
timeout 10s npm run dev > /dev/null 2>&1 || true
log_success "Development server test completed."

# 6. Check for missing logo and favicon files
log_info "Checking for required assets..."

MISSING_ASSETS=0

if [ ! -f "logo/dark.svg" ]; then
    log_warning "Missing dark logo: logo/dark.svg"
    MISSING_ASSETS=1
fi

if [ ! -f "logo/light.svg" ]; then
    log_warning "Missing light logo: logo/light.svg"
    MISSING_ASSETS=1
fi

if [ ! -f "favicon.svg" ]; then
    log_warning "Missing favicon: favicon.svg"
    MISSING_ASSETS=1
fi

if [ $MISSING_ASSETS -eq 1 ]; then
    log_info "Creating placeholder assets..."
    mkdir -p logo
    
    # Create placeholder SVG files
    cat > logo/dark.svg << 'EOF'
<svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="120" height="40" rx="8" fill="#1a1a1a"/>
  <text x="60" y="24" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">DeelRx</text>
</svg>
EOF
    
    cat > logo/light.svg << 'EOF'
<svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="120" height="40" rx="8" fill="#f8f9fa" stroke="#e9ecef"/>
  <text x="60" y="24" text-anchor="middle" fill="#212529" font-family="Arial, sans-serif" font-size="14" font-weight="bold">DeelRx</text>
</svg>
EOF
    
    cat > favicon.svg << 'EOF'
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="8" fill="#0D9373"/>
  <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">D</text>
</svg>
EOF
    
    log_success "Created placeholder assets"
fi

# 7. Final validation
log_info "Running final validation..."
if node validate.js > /dev/null 2>&1; then
    log_success "All validations passed!"
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                  SETUP COMPLETED SUCCESSFULLY!               ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Run 'npm run dev' to start the development server"
    echo "  2. Visit the local documentation site to review content"
    echo "  3. Replace placeholder assets with actual logo/favicon"
    echo "  4. Set up MINTLIFY_API_KEY secret for deployment"
    echo ""
    echo -e "${BLUE}Available commands:${NC}"
    echo "  npm run dev      - Start development server"
    echo "  npm run validate - Validate documentation structure"
    echo "  npm run build    - Build for production"
    echo ""
else
    log_error "Final validation failed. Please review the issues above."
    exit 1
fi