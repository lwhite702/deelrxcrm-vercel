#!/bin/bash
# Phase 4B - Project update and maintenance script

set -e

# Colors for output
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

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Run this script from project root."
    exit 1
fi

# Function to check and install dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Required Phase 4B packages
    local required_deps=(
        "@knocklabs/node"
        "resend"
        "@statsig/react-bindings"
        "statsig-node" 
        "@sentry/nextjs"
    )
    
    local missing_deps=()
    
    for dep in "${required_deps[@]}"; do
        if ! npm list "$dep" > /dev/null 2>&1; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -eq 0 ]; then
        print_success "All required dependencies are installed"
        return 0
    fi
    
    print_warning "Missing dependencies: ${missing_deps[*]}"
    print_status "Installing missing dependencies..."
    
    npm install "${missing_deps[@]}" --legacy-peer-deps
    
    print_success "Dependencies installed successfully"
}

# Function to update environment template
update_env_template() {
    print_status "Updating .env.example template..."
    
    local env_vars=(
        "# Phase 4B - Core Integrations"
        "SENTRY_DSN="
        "SENTRY_ORG="
        "SENTRY_PROJECT="
        "KNOCK_API_KEY="
        "RESEND_API_KEY="
        "STATSIG_SERVER_SECRET="
        "STATSIG_CLIENT_KEY="
    )
    
    # Check if Phase 4B section exists
    if ! grep -q "# Phase 4B - Core Integrations" .env.example 2>/dev/null; then
        print_status "Adding Phase 4B environment variables..."
        {
            echo ""
            printf '%s\n' "${env_vars[@]}"
        } >> .env.example
        print_success "Environment template updated"
    else
        print_success "Environment template is up to date"
    fi
}

# Function to validate TypeScript configuration
validate_typescript() {
    print_status "Validating TypeScript configuration..."
    
    if ! command -v npx &> /dev/null; then
        print_error "npx not found. Please install Node.js"
        return 1
    fi
    
    # Check TypeScript compilation
    if npx tsc --noEmit --skipLibCheck; then
        print_success "TypeScript validation passed"
    else
        print_warning "TypeScript validation issues found"
        print_status "Common fixes:"
        echo "  - Check import paths"
        echo "  - Verify type definitions"
        echo "  - Update schema types if needed"
    fi
}

# Function to check environment variables
check_environment() {
    print_status "Checking environment configuration..."
    
    local required_vars=(
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
    )
    
    local missing_vars=()
    
    # Load .env.local if it exists
    if [ -f ".env.local" ]; then
        set -a
        source .env.local
        set +a
    fi
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        print_success "Core environment variables are configured"
    else
        print_warning "Missing environment variables: ${missing_vars[*]}"
        print_status "Please configure these in .env.local"
    fi
    
    # Check Phase 4B optional variables
    local phase4b_vars=(
        "SENTRY_DSN"
        "KNOCK_API_KEY" 
        "RESEND_API_KEY"
        "STATSIG_SERVER_SECRET"
    )
    
    local missing_phase4b=()
    
    for var in "${phase4b_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_phase4b+=("$var")
        fi
    done
    
    if [ ${#missing_phase4b[@]} -gt 0 ]; then
        print_warning "Phase 4B integrations need configuration: ${missing_phase4b[*]}"
        print_status "These are optional but recommended for full functionality"
    fi
}

# Function to run database checks
check_database() {
    print_status "Checking database connectivity..."
    
    if [ -f "scripts/check-db.ts" ]; then
        if npx tsx scripts/check-db.ts > /dev/null 2>&1; then
            print_success "Database connection verified"
        else
            print_warning "Database connection issues detected"
            print_status "Run 'npx tsx scripts/check-db.ts' for details"
        fi
    else
        print_warning "Database check script not found"
    fi
}

# Function to update project documentation
update_documentation() {
    print_status "Updating project documentation..."
    
    local docs_updated=false
    
    # Check if integration docs exist
    if [ ! -f "docs/INTEGRATIONS.md" ]; then
        print_warning "Integration documentation missing"
        docs_updated=true
    fi
    
    # Check if alerting docs exist  
    if [ ! -f "docs/ALERTING.md" ]; then
        print_warning "Alerting documentation missing"
        docs_updated=true
    fi
    
    if [ "$docs_updated" = true ]; then
        print_status "Consider creating missing documentation files"
    else
        print_success "Documentation files are present"
    fi
}

# Function to clean up old build artifacts
cleanup_build() {
    print_status "Cleaning up build artifacts..."
    
    local cleanup_dirs=(
        ".next"
        "dist"
        "node_modules/.cache"
    )
    
    for dir in "${cleanup_dirs[@]}"; do
        if [ -d "$dir" ]; then
            print_status "Removing $dir..."
            rm -rf "$dir"
        fi
    done
    
    print_success "Build cleanup completed"
}

# Function to run project health check
health_check() {
    print_status "Running project health check..."
    
    local issues=()
    
    # Check package.json
    if [ ! -f "package.json" ]; then
        issues+=("Missing package.json")
    fi
    
    # Check TypeScript config
    if [ ! -f "tsconfig.json" ]; then
        issues+=("Missing tsconfig.json")
    fi
    
    # Check Next.js config
    if [ ! -f "next.config.ts" ] && [ ! -f "next.config.js" ]; then
        issues+=("Missing Next.js config")
    fi
    
    # Check environment template
    if [ ! -f ".env.example" ]; then
        issues+=("Missing .env.example")
    fi
    
    if [ ${#issues[@]} -eq 0 ]; then
        print_success "Project health check passed"
    else
        print_warning "Health check issues found:"
        printf '  - %s\n' "${issues[@]}"
    fi
}

# Main script logic
case "${1:-help}" in
    "deps")
        check_dependencies
        ;;
    
    "env")
        update_env_template
        check_environment
        ;;
    
    "validate")
        validate_typescript
        ;;
    
    "db")
        check_database
        ;;
    
    "docs")
        update_documentation
        ;;
    
    "clean")
        cleanup_build
        ;;
    
    "health")
        health_check
        ;;
    
    "full")
        print_status "Running full project update..."
        echo
        
        check_dependencies
        echo
        
        update_env_template
        check_environment
        echo
        
        validate_typescript
        echo
        
        check_database
        echo
        
        update_documentation
        echo
        
        health_check
        echo
        
        print_success "Full project update completed!"
        ;;
    
    "help")
        echo "Phase 4B Project Update & Maintenance"
        echo
        echo "Usage: $0 <command>"
        echo
        echo "Commands:"
        echo "  deps       Check and install required dependencies"
        echo "  env        Update environment template and check config"
        echo "  validate   Run TypeScript validation"
        echo "  db         Check database connectivity"
        echo "  docs       Update project documentation"
        echo "  clean      Clean build artifacts"
        echo "  health     Run project health check"
        echo "  full       Run all checks and updates"
        echo "  help       Show this help message"
        echo
        echo "Examples:"
        echo "  $0 deps        # Install missing dependencies"
        echo "  $0 env         # Check environment configuration"
        echo "  $0 full        # Run complete project update"
        ;;
    
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac