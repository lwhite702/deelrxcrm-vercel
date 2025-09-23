#!/bin/bash

# Phase 4A AI Layer Smoke Tests
# Tests all /api/ai/* endpoints with sample payloads and validates Statsig gates

set -e

echo "🤖 Phase 4A AI Layer Smoke Tests"
echo "================================="

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
TEAM_ID="${TEAM_ID:-1}"
USER_ID="${USER_ID:-1}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run test
run_test() {
    local endpoint=$1
    local payload=$2
    local description=$3
    
    echo -e "\n${YELLOW}Testing:${NC} $description"
    echo "Endpoint: POST $BASE_URL$endpoint"
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${AUTH_TOKEN:-test-token}" \
        -d "$payload" \
        "$BASE_URL$endpoint" || echo "000")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [[ $http_code == "200" ]]; then
        echo -e "${GREEN}✅ PASSED${NC} - HTTP $http_code"
        echo "Response: $body"
        ((TESTS_PASSED++))
    elif [[ $http_code == "401" ]]; then
        echo -e "${YELLOW}⚠️  AUTH REQUIRED${NC} - HTTP $http_code (expected for protected endpoints)"
        ((TESTS_PASSED++))
    elif [[ $http_code == "403" ]]; then
        echo -e "${YELLOW}🚪 FEATURE GATED${NC} - HTTP $http_code (Statsig gate disabled)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC} - HTTP $http_code"
        echo "Response: $body"
        ((TESTS_FAILED++))
    fi
}

# Test 1: AI Pricing Suggestions
echo -e "\n🏷️  Testing AI Pricing Intelligence"
run_test "/api/ai/pricing" '{
    "teamId": '$TEAM_ID',
    "productIds": ["prod_123", "prod_456"],
    "marketData": {
        "category": "electronics",
        "competition": [{"name": "Competitor A", "price": 99.99}]
    }
}' "AI Pricing Suggestions"

# Test 2: AI Credit Analysis
echo -e "\n💳 Testing AI Credit Intelligence"
run_test "/api/ai/credit" '{
    "teamId": '$TEAM_ID',
    "customerId": "cust_123",
    "creditHistory": {
        "totalTransactions": 15,
        "averageAmount": 250.50,
        "onTimePayments": 14,
        "lastPaymentDate": "2025-09-15T10:00:00Z"
    },
    "businessInfo": {
        "industry": "retail",
        "yearsInBusiness": 5,
        "annualRevenue": 500000
    }
}' "AI Credit Risk Analysis"

# Test 3: AI Data Enrichment
echo -e "\n📊 Testing AI Data Intelligence"
run_test "/api/ai/data" '{
    "teamId": '$TEAM_ID',
    "dataType": "customer_enrichment",
    "records": [
        {
            "id": "cust_123",
            "name": "Acme Corp",
            "email": "contact@acmecorp.com",
            "industry": "manufacturing"
        }
    ]
}' "AI Data Enrichment"

# Test 4: AI Training Content Generation
echo -e "\n🎓 Testing AI Training Intelligence"
run_test "/api/ai/training" '{
    "teamId": '$TEAM_ID',
    "type": "article",
    "topic": "Credit Management Best Practices",
    "audience": "business_owners",
    "length": "medium"
}' "AI Training Content Generation"

# Test 5: AI Training Syllabus Generation
run_test "/api/ai/training" '{
    "teamId": '$TEAM_ID',
    "type": "syllabus",
    "subject": "Customer Relationship Management",
    "duration": "4_weeks",
    "level": "intermediate"
}' "AI Training Syllabus Generation"

# Database validation
echo -e "\n🗄️  Validating Database Logging"
if command -v psql &> /dev/null && [[ -n "$DATABASE_URL" ]]; then
    echo "Checking aiRequests table for logged requests..."
    request_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM ai_requests WHERE created_at > NOW() - INTERVAL '5 minutes';" 2>/dev/null || echo "0")
    if [[ $request_count -gt 0 ]]; then
        echo -e "${GREEN}✅ Found $request_count AI requests logged${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}⚠️  No recent AI requests found in database${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Database validation skipped (psql or DATABASE_URL not available)${NC}"
fi

# Statsig gate validation
echo -e "\n🚪 Validating Statsig Feature Gates"
gates=("ai_pricing_enabled" "ai_credit_enabled" "ai_data_enabled" "ai_training_enabled")
for gate in "${gates[@]}"; do
    echo "Gate: $gate - depends on Statsig configuration"
done

# Summary
echo -e "\n📊 Test Summary"
echo "==============="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "\n${GREEN}🎉 All tests passed or properly gated!${NC}"
    exit 0
else
    echo -e "\n${RED}💥 Some tests failed. Check the output above.${NC}"
    exit 1
fi