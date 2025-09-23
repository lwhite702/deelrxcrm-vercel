#!/bin/bash
# Phase 4B - Integration smoke tests script

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

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
TIMEOUT="${TIMEOUT:-10}"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run HTTP test
http_test() {
    local name="$1"
    local url="$2" 
    local expected_status="${3:-200}"
    local method="${4:-GET}"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    print_test "$name"
    
    local response
    local status_code
    
    if ! response=$(curl -s -w "%{http_code}" -X "$method" --max-time "$TIMEOUT" "$url" 2>/dev/null); then
        print_error "Failed to connect to $url"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
    
    status_code="${response: -3}"
    
    if [ "$status_code" = "$expected_status" ]; then
        print_success "✓ $name ($status_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        print_error "✗ $name (expected $expected_status, got $status_code)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Function to test API endpoint with JSON response
api_test() {
    local name="$1"
    local endpoint="$2"
    local expected_field="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    print_test "$name"
    
    local response
    local status_code
    local body
    
    if ! response=$(curl -s -w "%{http_code}" --max-time "$TIMEOUT" "$BASE_URL$endpoint" 2>/dev/null); then
        print_error "Failed to connect to $endpoint"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
    
    status_code="${response: -3}"
    body="${response%???}"
    
    if [ "$status_code" != "200" ]; then
        print_error "✗ $name (HTTP $status_code)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
    
    if [ -n "$expected_field" ] && ! echo "$body" | grep -q "$expected_field"; then
        print_error "✗ $name (missing field: $expected_field)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
    
    print_success "✓ $name"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    return 0
}

# Function to test process/service availability
service_test() {
    local name="$1"
    local command="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    print_test "$name"
    
    if eval "$command" > /dev/null 2>&1; then
        print_success "✓ $name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        print_error "✗ $name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Function to test environment variables
env_test() {
    local name="$1" 
    local var_name="$2"
    local required="${3:-false}"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    print_test "$name"
    
    if [ -n "${!var_name}" ]; then
        print_success "✓ $name (configured)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    elif [ "$required" = "true" ]; then
        print_error "✗ $name (required but missing)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    else
        print_warning "⚠ $name (optional, not configured)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    fi
}

# Function to run file system tests
file_test() {
    local name="$1"
    local file_path="$2"
    local check_type="${3:-exists}"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    print_test "$name"
    
    case "$check_type" in
        "exists")
            if [ -e "$file_path" ]; then
                print_success "✓ $name"
                TESTS_PASSED=$((TESTS_PASSED + 1))
                return 0
            fi
            ;;
        "readable")
            if [ -r "$file_path" ]; then
                print_success "✓ $name"
                TESTS_PASSED=$((TESTS_PASSED + 1))
                return 0
            fi
            ;;
        "executable")
            if [ -x "$file_path" ]; then
                print_success "✓ $name"
                TESTS_PASSED=$((TESTS_PASSED + 1))
                return 0
            fi
            ;;
    esac
    
    print_error "✗ $name"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
}

# Function to print test summary
print_summary() {
    echo
    echo "=================================="
    echo "SMOKE TEST SUMMARY"
    echo "=================================="
    echo "Tests Run:    $TESTS_RUN"
    echo "Tests Passed: $TESTS_PASSED"
    echo "Tests Failed: $TESTS_FAILED"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        print_success "All tests passed! ✨"
        return 0
    else
        print_error "Some tests failed. Check output above."
        return 1
    fi
}

# Load environment variables if available
if [ -f ".env.local" ]; then
    set -a
    source .env.local
    set +a
fi

# Test suites
run_basic_tests() {
    echo "=========================================="
    echo "BASIC FUNCTIONALITY TESTS"
    echo "=========================================="
    
    # File system tests
    file_test "Package.json exists" "package.json"
    file_test "TypeScript config exists" "tsconfig.json" 
    file_test "Next.js config exists" "next.config.ts"
    file_test "Environment template exists" ".env.example"
    
    # Script availability
    file_test "Git flow script exists" "scripts/git-flow.sh" 
    file_test "Project update script exists" "scripts/project-update.sh"
    file_test "Git flow script executable" "scripts/git-flow.sh" "executable"
    file_test "Project update script executable" "scripts/project-update.sh" "executable"
}

run_environment_tests() {
    echo "=========================================="
    echo "ENVIRONMENT CONFIGURATION TESTS"
    echo "=========================================="
    
    # Core required variables
    env_test "Database URL configured" "DATABASE_URL" "true"
    env_test "Auth secret configured" "AUTH_SECRET" "true"
    env_test "Base URL configured" "NEXTAUTH_URL" "false"
    
    # Phase 4B integration variables (optional)
    env_test "Sentry DSN configured" "SENTRY_DSN"
    env_test "Knock API key configured" "KNOCK_API_KEY"
    env_test "Resend API key configured" "RESEND_API_KEY"
    env_test "Statsig server secret configured" "STATSIG_SERVER_SECRET"
    env_test "Statsig client key configured" "STATSIG_CLIENT_KEY"
}

run_service_tests() {
    echo "=========================================="
    echo "SERVICE AVAILABILITY TESTS"
    echo "=========================================="
    
    # Node.js and npm
    service_test "Node.js available" "node --version"
    service_test "NPM available" "npm --version"
    service_test "TypeScript available" "npx tsc --version"
    
    # Database connectivity (if script exists)
    if [ -f "scripts/check-db.ts" ]; then
        service_test "Database connectivity" "npx tsx scripts/check-db.ts"
    fi
}

run_http_tests() {
    echo "=========================================="
    echo "HTTP ENDPOINT TESTS"
    echo "=========================================="
    
    print_status "Testing against: $BASE_URL"
    
    # Basic health checks
    api_test "Health check - liveness" "/api/_health/live" "status"
    api_test "Health check - readiness" "/api/_health/ready" "status"
    
    # Core API endpoints
    http_test "Home page accessible" "$BASE_URL" "200"
    http_test "API base path" "$BASE_URL/api" "404" # Expected 404 for base API path
    
    # Authentication endpoints
    http_test "Auth API available" "$BASE_URL/api/auth/me" "401" # Expected 401 without auth
    
    # Inngest webhook (should return method not allowed for GET)
    http_test "Inngest webhook available" "$BASE_URL/api/inngest" "405"
}

run_integration_tests() {
    echo "=========================================="
    echo "INTEGRATION TESTS"
    echo "=========================================="
    
    # Documentation files
    file_test "Integration docs exist" "docs/INTEGRATIONS.md"
    file_test "Alerting docs exist" "docs/ALERTING.md"
    
    # Phase 4B implementation files
    file_test "Auth guards exist" "lib/auth/guards.ts"
    file_test "Notifications service exists" "lib/notifications.ts"
    file_test "Statsig server config exists" "lib/statsig-server.ts"
    file_test "Rate limiting exists" "lib/rate-limit.ts"
    
    # Vendor integrations
    file_test "Knock integration exists" "lib/vendors/knock.ts"
    file_test "Resend integration exists" "lib/vendors/resend.ts"
    
    # Enhanced background jobs
    file_test "Credit job exists" "lib/inngest/functions/credit.ts"
    file_test "Admin job exists" "lib/inngest/functions/admin.ts"
}

# Main script logic
case "${1:-all}" in
    "basic")
        run_basic_tests
        print_summary
        ;;
    
    "env")
        run_environment_tests
        print_summary
        ;;
    
    "services")
        run_service_tests
        print_summary
        ;;
    
    "http")
        run_http_tests
        print_summary
        ;;
    
    "integration")
        run_integration_tests
        print_summary
        ;;
    
    "all")
        print_status "Running comprehensive smoke tests for Phase 4B..."
        echo
        
        run_basic_tests
        echo
        
        run_environment_tests
        echo
        
        run_service_tests
        echo
        
        run_integration_tests
        echo
        
        # Only run HTTP tests if we can detect a running server
        if curl -s --max-time 5 "$BASE_URL" > /dev/null 2>&1; then
            run_http_tests
            echo
        else
            print_warning "Server not running at $BASE_URL, skipping HTTP tests"
            print_status "Start server with 'npm run dev' to run HTTP tests"
            echo
        fi
        
        print_summary
        ;;
    
    "help")
        echo "Phase 4B Integration Smoke Tests"
        echo
        echo "Usage: $0 <command>"
        echo
        echo "Test Suites:"
        echo "  basic       Test basic file structure and scripts"
        echo "  env         Test environment configuration"
        echo "  services    Test service availability (Node, DB, etc)"
        echo "  http        Test HTTP endpoints (requires running server)"
        echo "  integration Test Phase 4B integration files"
        echo "  all         Run all test suites (default)"
        echo "  help        Show this help message"
        echo
        echo "Environment Variables:"
        echo "  BASE_URL    Server URL for HTTP tests (default: http://localhost:3000)"
        echo "  TIMEOUT     HTTP request timeout in seconds (default: 10)"
        echo
        echo "Examples:"
        echo "  $0 basic                    # Test basic functionality"
        echo "  $0 http                     # Test HTTP endpoints"
        echo "  BASE_URL=https://example.com $0 http  # Test remote server"
        echo "  $0 all                      # Run all tests"
        ;;
    
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac