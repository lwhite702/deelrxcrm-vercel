#!/bin/bash

# Project Update Script - Phase 5 DeelRx CRM
# Updates dependencies, runs security checks, and validates Phase 5 implementation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}DeelRx CRM - Phase 5 Project Update${NC}"
echo "==========================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    echo -e "${BLUE}Checking Node.js version...${NC}"
    
    if ! command_exists node; then
        echo -e "${RED}Error: Node.js is not installed${NC}"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2)
    local required_version="18.0.0"
    
    if ! npx semver-compare "$node_version" ">=" "$required_version" 2>/dev/null; then
        echo -e "${YELLOW}Warning: Node.js version $node_version detected. Recommended: >= $required_version${NC}"
    else
        echo -e "${GREEN}Node.js version $node_version is compatible${NC}"
    fi
}

# Function to update package dependencies
update_dependencies() {
    echo -e "${BLUE}Updating project dependencies...${NC}"
    
    # Check if package.json exists
    if [[ ! -f package.json ]]; then
        echo -e "${RED}Error: package.json not found${NC}"
        exit 1
    fi
    
    # Install/update dependencies
    echo "Installing npm dependencies..."
    npm install
    
    # Add Phase 5 specific dependencies if not already present
    echo "Adding Phase 5 security dependencies..."
    
    # Security and monitoring dependencies
    npm install --save \
        @upstash/redis \
        @upstash/ratelimit \
        statsig-node \
        @sentry/nextjs \
        helmet \
        express-rate-limit \
        express-slow-down \
        crypto \
        bcryptjs \
        validator \
        cors \
        compression
    
    # Development and testing dependencies
    npm install --save-dev \
        @types/bcryptjs \
        @types/validator \
        @types/cors \
        @types/compression \
        eslint-plugin-security \
        @typescript-eslint/eslint-plugin \
        @typescript-eslint/parser
    
    echo -e "${GREEN}Dependencies updated successfully${NC}"
}

# Function to run security audit
run_security_audit() {
    echo -e "${BLUE}Running security audit...${NC}"
    
    # Run npm audit
    echo "Running npm audit..."
    if ! npm audit --audit-level=moderate; then
        echo -e "${YELLOW}Security vulnerabilities found. Attempting to fix...${NC}"
        npm audit fix
        
        # Run audit again to check if issues were resolved
        if ! npm audit --audit-level=high; then
            echo -e "${RED}High-severity vulnerabilities still present. Manual review required.${NC}"
        else
            echo -e "${GREEN}Security vulnerabilities resolved${NC}"
        fi
    else
        echo -e "${GREEN}No security vulnerabilities found${NC}"
    fi
}

# Function to validate environment variables
validate_environment() {
    echo -e "${BLUE}Validating environment configuration...${NC}"
    
    # Check for required environment variables
    local required_vars=(
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
        "STRIPE_SECRET_KEY"
        "STRIPE_WEBHOOK_SECRET"
        "UPSTASH_REDIS_REST_URL"
        "UPSTASH_REDIS_REST_TOKEN"
        "STATSIG_SECRET_KEY"
        "SENTRY_DSN"
        "ENCRYPTION_KEY"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        echo -e "${RED}Missing required environment variables:${NC}"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo -e "${YELLOW}Please set these variables in your .env.local file${NC}"
        return 1
    else
        echo -e "${GREEN}All required environment variables are set${NC}"
    fi
}

# Function to run database checks
check_database() {
    echo -e "${BLUE}Checking database connection...${NC}"
    
    if command_exists npx; then
        if npx tsx scripts/check-db.ts 2>/dev/null; then
            echo -e "${GREEN}Database connection successful${NC}"
        else
            echo -e "${YELLOW}Database check script not found or failed${NC}"
            echo "Please ensure your database is properly configured"
        fi
    else
        echo -e "${YELLOW}tsx not available, skipping database check${NC}"
    fi
}

# Function to validate Phase 5 security implementation
validate_phase5_security() {
    echo -e "${BLUE}Validating Phase 5 security implementation...${NC}"
    
    local security_files=(
        "lib/security/headers.ts"
        "lib/security/rateLimit.ts"
        "lib/security/encryption.ts"
        "lib/security/idempotency.ts"
        "lib/security/auditLog.ts"
        "lib/security/statsig.ts"
        "lib/config/requiredEnv.ts"
        "middleware.ts"
    )
    
    local missing_files=()
    
    for file in "${security_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        echo -e "${RED}Missing Phase 5 security files:${NC}"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
        return 1
    else
        echo -e "${GREEN}All Phase 5 security files present${NC}"
    fi
    
    # Check health endpoints
    local health_files=(
        "app/api/_health/live/route.ts"
        "app/api/_health/ready/route.ts"
    )
    
    for file in "${health_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            echo -e "${YELLOW}Warning: Health check endpoint missing: $file${NC}"
        fi
    done
}

# Function to run type checking
run_type_check() {
    echo -e "${BLUE}Running TypeScript type checking...${NC}"
    
    if command_exists npx; then
        if npx tsc --noEmit; then
            echo -e "${GREEN}TypeScript type checking passed${NC}"
        else
            echo -e "${RED}TypeScript type errors found${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}TypeScript compiler not available${NC}"
    fi
}

# Function to run linting
run_linting() {
    echo -e "${BLUE}Running ESLint...${NC}"
    
    if command_exists npx; then
        if npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0; then
            echo -e "${GREEN}Linting passed${NC}"
        else
            echo -e "${YELLOW}Linting issues found. Run 'npm run lint:fix' to auto-fix${NC}"
        fi
    else
        echo -e "${YELLOW}ESLint not available${NC}"
    fi
}

# Function to build the project
build_project() {
    echo -e "${BLUE}Building project...${NC}"
    
    if npm run build; then
        echo -e "${GREEN}Build successful${NC}"
    else
        echo -e "${RED}Build failed${NC}"
        return 1
    fi
}

# Function to run tests
run_tests() {
    echo -e "${BLUE}Running tests...${NC}"
    
    # Check if test script exists
    if npm run test --silent 2>/dev/null; then
        echo -e "${GREEN}Tests passed${NC}"
    else
        echo -e "${YELLOW}No tests configured or tests failed${NC}"
    fi
}

# Function to generate security report
generate_security_report() {
    echo -e "${BLUE}Generating security report...${NC}"
    
    local report_file="security-report-$(date +%Y%m%d).txt"
    
    {
        echo "DeelRx CRM - Phase 5 Security Report"
        echo "Generated: $(date)"
        echo "======================================="
        echo ""
        
        echo "Environment Variables Status:"
        validate_environment && echo "✅ All required variables set" || echo "❌ Missing variables"
        echo ""
        
        echo "Security Files Status:"
        validate_phase5_security && echo "✅ All security files present" || echo "❌ Missing security files"
        echo ""
        
        echo "Dependencies Audit:"
        npm audit --json | jq -r '.metadata | "Total: \(.totalDependencies), Vulnerabilities: \(.vulnerabilities.total)"' 2>/dev/null || echo "Unable to generate audit summary"
        echo ""
        
        echo "TypeScript Status:"
        run_type_check && echo "✅ No type errors" || echo "❌ Type errors found"
        echo ""
        
        echo "Build Status:"
        npm run build > /dev/null 2>&1 && echo "✅ Build successful" || echo "❌ Build failed"
        
    } > "$report_file"
    
    echo -e "${GREEN}Security report generated: $report_file${NC}"
}

# Function to show project status
show_project_status() {
    echo -e "\n${BLUE}Project Status Summary:${NC}"
    echo "======================="
    
    echo "Node.js Version: $(node --version)"
    echo "npm Version: $(npm --version)"
    
    if [[ -f package.json ]]; then
        echo "Project Version: $(node -p "require('./package.json').version")"
    fi
    
    echo "Git Branch: $(git branch --show-current 2>/dev/null || echo 'Not a git repository')"
    echo "Last Commit: $(git log -1 --format="%h %s" 2>/dev/null || echo 'No commits')"
    
    echo -e "\nDependency Status:"
    npm outdated --depth=0 2>/dev/null || echo "All dependencies up to date"
}

# Main update function
main() {
    echo "Phase 5 Project Update Options:"
    echo "1. Quick update (dependencies + security audit)"
    echo "2. Full update (all checks + build)"
    echo "3. Security validation only"
    echo "4. Environment validation"
    echo "5. Generate security report"
    echo "6. Show project status"
    echo "7. Custom update (select components)"
    echo "8. Exit"
    
    read -p "Select option (1-8): " choice
    
    case $choice in
        1)
            check_node_version
            update_dependencies
            run_security_audit
            validate_phase5_security
            echo -e "${GREEN}Quick update completed!${NC}"
            ;;
        2)
            check_node_version
            update_dependencies
            run_security_audit
            validate_environment
            validate_phase5_security
            check_database
            run_type_check
            run_linting
            build_project
            run_tests
            echo -e "${GREEN}Full update completed!${NC}"
            ;;
        3)
            validate_phase5_security
            run_security_audit
            validate_environment
            echo -e "${GREEN}Security validation completed!${NC}"
            ;;
        4)
            validate_environment
            ;;
        5)
            generate_security_report
            ;;
        6)
            show_project_status
            ;;
        7)
            echo "Custom update options:"
            echo "a) Update dependencies"
            echo "b) Run security audit"
            echo "c) Validate environment"
            echo "d) Check database"
            echo "e) Run type checking"
            echo "f) Run linting"
            echo "g) Build project"
            echo "h) Run tests"
            
            read -p "Select options (e.g., 'abc'): " custom_options
            
            [[ $custom_options =~ a ]] && update_dependencies
            [[ $custom_options =~ b ]] && run_security_audit
            [[ $custom_options =~ c ]] && validate_environment
            [[ $custom_options =~ d ]] && check_database
            [[ $custom_options =~ e ]] && run_type_check
            [[ $custom_options =~ f ]] && run_linting
            [[ $custom_options =~ g ]] && build_project
            [[ $custom_options =~ h ]] && run_tests
            
            echo -e "${GREEN}Custom update completed!${NC}"
            ;;
        8)
            echo -e "${GREEN}Exiting project update${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Please select 1-8.${NC}"
            exit 1
            ;;
    esac
    
    show_project_status
}

# Run main function
main
