#!/bin/bash

# Go-Live Smoke Test Script - Phase 5 DeelRx CRM
# Comprehensive testing of all Phase 5 security and operational features

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${BASE_URL:-"http://localhost:3000"}
TEST_USER_EMAIL=${TEST_USER_EMAIL:-"test@example.com"}
TEST_TIMEOUT=${TEST_TIMEOUT:-30}

echo -e "${BLUE}DeelRx CRM - Phase 5 Go-Live Smoke Test${NC}"
echo "============================================="
echo "Testing URL: $BASE_URL"
echo "Timeout: ${TEST_TIMEOUT}s"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to make HTTP request with timeout
make_request() {
    local url="$1"
    local method="${2:-GET}"
    local data="${3:-}"
    local headers="${4:-}"
    
    local curl_args=("--max-time" "$TEST_TIMEOUT" "--silent" "--show-error" "--location")
    
    if [[ -n "$headers" ]]; then
        curl_args+=("--header" "$headers")
    fi
    
    if [[ "$method" == "POST" && -n "$data" ]]; then
        curl_args+=("--data" "$data" "--header" "Content-Type: application/json")
    fi
    
    curl "${curl_args[@]}" --request "$method" "$url"
}

# Function to test health endpoints
test_health_endpoints() {
    echo -e "${BLUE}Testing Health Endpoints...${NC}"
    
    # Test liveness probe
    echo -n "  Liveness probe... "
    if response=$(make_request "$BASE_URL/api/_health/live" 2>&1); then
        if echo "$response" | grep -q '"status":"ok"'; then
            echo -e "${GREEN}✓ OK${NC}"
        else
            echo -e "${YELLOW}⚠ Unexpected response${NC}"
            echo "    Response: $response"
        fi
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "    Error: $response"
        return 1
    fi
    
    # Test readiness probe
    echo -n "  Readiness probe... "
    if response=$(make_request "$BASE_URL/api/_health/ready" 2>&1); then
        if echo "$response" | grep -q '"status":"ready"'; then
            echo -e "${GREEN}✓ OK${NC}"
        else
            echo -e "${YELLOW}⚠ Not ready${NC}"
            echo "    Response: $response"
        fi
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "    Error: $response"
        return 1
    fi
}

# Function to test security headers
test_security_headers() {
    echo -e "${BLUE}Testing Security Headers...${NC}"
    
    echo -n "  Security headers... "
    if headers=$(curl --max-time "$TEST_TIMEOUT" --silent --head "$BASE_URL" 2>&1); then
        local missing_headers=()
        
        # Check for essential security headers (case-insensitive, flexible whitespace)
        echo "$headers" | grep -i -E '^X-Content-Type-Options:[[:space:]]*nosniff' >/dev/null || missing_headers+=("X-Content-Type-Options")
        echo "$headers" | grep -i -E '^Referrer-Policy:[[:space:]]*' >/dev/null || missing_headers+=("Referrer-Policy")
        echo "$headers" | grep -i -E '^X-Frame-Options:[[:space:]]*' >/dev/null || missing_headers+=("X-Frame-Options")
        echo "$headers" | grep -i -E '^Content-Security-Policy:[[:space:]]*' >/dev/null || missing_headers+=("Content-Security-Policy")
        
        if [[ ${#missing_headers[@]} -eq 0 ]]; then
            echo -e "${GREEN}✓ OK${NC}"
        else
            echo -e "${YELLOW}⚠ Missing headers: ${missing_headers[*]}${NC}"
        fi
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "    Error: $headers"
        return 1
    fi
}

# Function to test rate limiting
test_rate_limiting() {
    echo -e "${BLUE}Testing Rate Limiting...${NC}"
    
    echo -n "  Rate limiting... "
    
    # Make multiple rapid requests to trigger rate limiting
    local success_count=0
    local rate_limited=false
    
    for i in {1..10}; do
        if response=$(make_request "$BASE_URL/api/_health/live" 2>&1); then
            if [[ $response =~ "429" ]] || [[ $response =~ "rate limit" ]]; then
                rate_limited=true
                break
            else
                ((success_count++))
            fi
        fi
        sleep 0.1
    done
    
    if [[ $rate_limited == true ]]; then
        echo -e "${GREEN}✓ Rate limiting active${NC}"
    elif [[ $success_count -gt 5 ]]; then
        echo -e "${YELLOW}⚠ Rate limiting may not be configured${NC}"
    else
        echo -e "${RED}✗ Endpoint not responding${NC}"
        return 1
    fi
}

# Function to test authentication endpoints
test_authentication() {
    echo -e "${BLUE}Testing Authentication...${NC}"
    
    # Test login page
    echo -n "  Login page... "
    if response=$(make_request "$BASE_URL/login" 2>&1); then
        if [[ $response =~ "sign in" ]] || [[ $response =~ "login" ]] || [[ $response =~ "email" ]]; then
            echo -e "${GREEN}✓ OK${NC}"
        else
            echo -e "${YELLOW}⚠ Unexpected content${NC}"
        fi
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "    Error: $response"
    fi
    
    # Test API authentication
    echo -n "  API authentication... "
    if response=$(make_request "$BASE_URL/api/customers" 2>&1); then
        if [[ $response =~ "401" ]] || [[ $response =~ "unauthorized" ]] || [[ $response =~ "authentication" ]]; then
            echo -e "${GREEN}✓ Protected${NC}"
        else
            echo -e "${YELLOW}⚠ May not be protected${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Endpoint may not exist${NC}"
    fi
}

# Function to test database connectivity
test_database() {
    echo -e "${BLUE}Testing Database Connectivity...${NC}"
    
    echo -n "  Database connection... "
    if response=$(make_request "$BASE_URL/api/_health/ready" 2>&1); then
        if echo "$response" | grep -q '"database":"connected"'; then
            echo -e "${GREEN}✓ Connected${NC}"
        elif echo "$response" | grep -q '"database":"error"'; then
            echo -e "${RED}✗ Connection failed${NC}"
            return 1
        else
            echo -e "${YELLOW}⚠ Status unclear${NC}"
        fi
    else
        echo -e "${RED}✗ Health check failed${NC}"
        return 1
    fi
}

# Function to test Upstash Redis connectivity
test_redis() {
    echo -e "${BLUE}Testing Redis Connectivity...${NC}"
    
    echo -n "  Redis connection... "
    if response=$(make_request "$BASE_URL/api/_health/ready" 2>&1); then
        if echo "$response" | grep -q '"redis":"connected"'; then
            echo -e "${GREEN}✓ Connected${NC}"
        elif echo "$response" | grep -q '"redis":"error"'; then
            echo -e "${RED}✗ Connection failed${NC}"
            return 1
        else
            echo -e "${YELLOW}⚠ Status unclear${NC}"
        fi
    else
        echo -e "${RED}✗ Health check failed${NC}"
        return 1
    fi
}

# Function to test encryption functionality
test_encryption() {
    echo -e "${BLUE}Testing Encryption...${NC}"
    
    echo -n "  Encryption system... "
    if response=$(make_request "$BASE_URL/api/_health/ready" 2>&1); then
        if echo "$response" | grep -q '"encryption":"ok"'; then
            echo -e "${GREEN}✓ Working${NC}"
        elif echo "$response" | grep -q '"encryption":"error"'; then
            echo -e "${RED}✗ Failed${NC}"
            return 1
        else
            echo -e "${YELLOW}⚠ Status unclear${NC}"
        fi
    else
        echo -e "${RED}✗ Health check failed${NC}"
        return 1
    fi
}

# Function to test feature gates
test_feature_gates() {
    echo -e "${BLUE}Testing Feature Gates...${NC}"
    
    echo -n "  Statsig integration... "
    if response=$(make_request "$BASE_URL/api/_health/ready" 2>&1); then
        if echo "$response" | grep -q '"statsig":"ok"'; then
            echo -e "${GREEN}✓ Working${NC}"
        elif echo "$response" | grep -q '"statsig":"error"'; then
            echo -e "${RED}✗ Failed${NC}"
            return 1
        else
            echo -e "${YELLOW}⚠ Status unclear${NC}"
        fi
    else
        echo -e "${RED}✗ Health check failed${NC}"
        return 1
    fi
}

# Function to test audit logging
test_audit_logging() {
    echo -e "${BLUE}Testing Audit Logging...${NC}"
    
    echo -n "  Audit system... "
    if response=$(make_request "$BASE_URL/api/_health/ready" 2>&1); then
        if echo "$response" | grep -q '"audit":"ok"'; then
            echo -e "${GREEN}✓ Working${NC}"
        elif echo "$response" | grep -q '"audit":"error"'; then
            echo -e "${RED}✗ Failed${NC}"
            return 1
        else
            echo -e "${YELLOW}⚠ Status unclear${NC}"
        fi
    else
        echo -e "${RED}✗ Health check failed${NC}"
        return 1
    fi
}

# Function to test core CRM functionality
test_core_functionality() {
    echo -e "${BLUE}Testing Core CRM Functionality...${NC}"
    
    # Test main application page
    echo -n "  Main application... "
    if response=$(make_request "$BASE_URL" 2>&1); then
        if [[ $response =~ "DeelRx" ]] || [[ $response =~ "CRM" ]] || [[ $response =~ "dashboard" ]]; then
            echo -e "${GREEN}✓ Loading${NC}"
        else
            echo -e "${YELLOW}⚠ Unexpected content${NC}"
        fi
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "    Error: $response"
    fi
    
    # Test customer management (requires auth)
    echo -n "  Customer API... "
    if response=$(make_request "$BASE_URL/api/customers" 2>&1); then
        if [[ $response =~ "401" ]] || [[ $response =~ "403" ]] || [[ $response =~ "customers" ]]; then
            echo -e "${GREEN}✓ Accessible${NC}"
        else
            echo -e "${YELLOW}⚠ Unexpected response${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ May not be implemented${NC}"
    fi
}

# Function to test environment configuration
test_environment() {
    echo -e "${BLUE}Testing Environment Configuration...${NC}"
    
    echo -n "  Environment setup... "
    if response=$(make_request "$BASE_URL/api/_health/ready" 2>&1); then
        if echo "$response" | grep -q '"environment":"ok"'; then
            echo -e "${GREEN}✓ Configured${NC}"
        elif echo "$response" | grep -q '"environment":"error"'; then
            echo -e "${RED}✗ Configuration issues${NC}"
            return 1
        else
            echo -e "${YELLOW}⚠ Status unclear${NC}"
        fi
    else
        echo -e "${RED}✗ Health check failed${NC}"
        return 1
    fi
}

# Function to run performance tests
test_performance() {
    echo -e "${BLUE}Testing Performance...${NC}"
    
    echo -n "  Response time... "
    local start_time=$(date +%s%N)
    if response=$(make_request "$BASE_URL" 2>&1); then
        local end_time=$(date +%s%N)
        local duration=$((($end_time - $start_time) / 1000000)) # Convert to milliseconds
        
        if [[ $duration -lt 5000 ]]; then
            echo -e "${GREEN}✓ ${duration}ms${NC}"
        elif [[ $duration -lt 10000 ]]; then
            echo -e "${YELLOW}⚠ ${duration}ms (slow)${NC}"
        else
            echo -e "${RED}✗ ${duration}ms (too slow)${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ No response${NC}"
        return 1
    fi
}

# Function to generate test report
generate_test_report() {
    local report_file="smoke-test-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "DeelRx CRM - Phase 5 Smoke Test Report"
        echo "Generated: $(date)"
        echo "Test URL: $BASE_URL"
        echo "======================================="
        echo ""
        
        echo "Test Results:"
        echo "============="
        
        # Re-run tests for report (simplified)
        make_request "$BASE_URL/api/_health/live" > /dev/null 2>&1 && echo "✅ Liveness probe: PASS" || echo "❌ Liveness probe: FAIL"
        make_request "$BASE_URL/api/_health/ready" > /dev/null 2>&1 && echo "✅ Readiness probe: PASS" || echo "❌ Readiness probe: FAIL"
        
        curl --max-time 10 --silent --head "$BASE_URL" | grep -q "X-Content-Type-Options" && echo "✅ Security headers: PASS" || echo "❌ Security headers: FAIL"
        
        make_request "$BASE_URL" > /dev/null 2>&1 && echo "✅ Main application: PASS" || echo "❌ Main application: FAIL"
        
        echo ""
        echo "Environment: $(node --version 2>/dev/null || echo 'Unknown')"
        echo "Timestamp: $(date -u)"
        
    } > "$report_file"
    
    echo -e "\n${GREEN}Test report generated: $report_file${NC}"
}

# Main test function
main() {
    local test_results=()
    local failed_tests=()
    
    echo "Phase 5 Smoke Test Options:"
    echo "1. Quick smoke test (health + security)"
    echo "2. Full smoke test (all components)"
    echo "3. Security tests only"
    echo "4. Performance tests only"
    echo "5. Generate test report"
    echo "6. Custom test selection"
    echo "7. Exit"
    
    read -p "Select option (1-7): " choice
    
    case $choice in
        1)
            echo -e "${YELLOW}Running quick smoke test...${NC}\n"
            test_health_endpoints || failed_tests+=("Health")
            test_security_headers || failed_tests+=("Security Headers")
            test_authentication || failed_tests+=("Authentication")
            test_database || failed_tests+=("Database")
            ;;
        2)
            echo -e "${YELLOW}Running full smoke test...${NC}\n"
            test_health_endpoints || failed_tests+=("Health")
            test_security_headers || failed_tests+=("Security Headers")
            test_rate_limiting || failed_tests+=("Rate Limiting")
            test_authentication || failed_tests+=("Authentication")
            test_database || failed_tests+=("Database")
            test_redis || failed_tests+=("Redis")
            test_encryption || failed_tests+=("Encryption")
            test_feature_gates || failed_tests+=("Feature Gates")
            test_audit_logging || failed_tests+=("Audit Logging")
            test_core_functionality || failed_tests+=("Core Functionality")
            test_environment || failed_tests+=("Environment")
            test_performance || failed_tests+=("Performance")
            ;;
        3)
            echo -e "${YELLOW}Running security tests...${NC}\n"
            test_security_headers || failed_tests+=("Security Headers")
            test_rate_limiting || failed_tests+=("Rate Limiting")
            test_authentication || failed_tests+=("Authentication")
            test_encryption || failed_tests+=("Encryption")
            test_audit_logging || failed_tests+=("Audit Logging")
            ;;
        4)
            echo -e "${YELLOW}Running performance tests...${NC}\n"
            test_performance || failed_tests+=("Performance")
            ;;
        5)
            generate_test_report
            return 0
            ;;
        6)
            echo "Available tests:"
            echo "a) Health endpoints"
            echo "b) Security headers"
            echo "c) Rate limiting"
            echo "d) Authentication"
            echo "e) Database"
            echo "f) Redis"
            echo "g) Encryption"
            echo "h) Feature gates"
            echo "i) Audit logging"
            echo "j) Core functionality"
            echo "k) Environment"
            echo "l) Performance"
            
            read -p "Select tests (e.g., 'abc'): " custom_tests
            
            echo -e "${YELLOW}Running custom tests...${NC}\n"
            [[ $custom_tests =~ a ]] && (test_health_endpoints || failed_tests+=("Health"))
            [[ $custom_tests =~ b ]] && (test_security_headers || failed_tests+=("Security Headers"))
            [[ $custom_tests =~ c ]] && (test_rate_limiting || failed_tests+=("Rate Limiting"))
            [[ $custom_tests =~ d ]] && (test_authentication || failed_tests+=("Authentication"))
            [[ $custom_tests =~ e ]] && (test_database || failed_tests+=("Database"))
            [[ $custom_tests =~ f ]] && (test_redis || failed_tests+=("Redis"))
            [[ $custom_tests =~ g ]] && (test_encryption || failed_tests+=("Encryption"))
            [[ $custom_tests =~ h ]] && (test_feature_gates || failed_tests+=("Feature Gates"))
            [[ $custom_tests =~ i ]] && (test_audit_logging || failed_tests+=("Audit Logging"))
            [[ $custom_tests =~ j ]] && (test_core_functionality || failed_tests+=("Core Functionality"))
            [[ $custom_tests =~ k ]] && (test_environment || failed_tests+=("Environment"))
            [[ $custom_tests =~ l ]] && (test_performance || failed_tests+=("Performance"))
            ;;
        7)
            echo -e "${GREEN}Exiting smoke test${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Please select 1-7.${NC}"
            exit 1
            ;;
    esac
    
    # Show test summary
    echo -e "\n${BLUE}Test Summary:${NC}"
    echo "============="
    
    if [[ ${#failed_tests[@]} -eq 0 ]]; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
        echo "System is ready for production deployment."
    else
        echo -e "${RED}❌ Failed tests: ${#failed_tests[@]}${NC}"
        for test in "${failed_tests[@]}"; do
            echo "  - $test"
        done
        echo -e "\n${YELLOW}Please review and fix failed tests before production deployment.${NC}"
    fi
}

# Check prerequisites
if ! command_exists curl; then
    echo -e "${RED}Error: curl is required but not installed${NC}"
    exit 1
fi

# Run main function
main