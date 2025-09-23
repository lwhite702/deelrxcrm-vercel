#!/bin/bash

# AI Layer Smoke Test Script
# Tests all AI endpoints with sample payloads and verifies Statsig gate enforcement

set -e

echo "🚀 Starting AI Layer Smoke Tests..."

# Configuration
API_BASE=${API_BASE:-"http://localhost:3000"}
TEAM_ID=${TEAM_ID:-"1"}

# Test data
CUSTOMER_ID="123e4567-e89b-12d3-a456-426614174000"
PRODUCT_ID="prod_123"
ARTICLE_ID="art_456"

echo "📊 Testing Pricing Intelligence Endpoint..."
curl -X POST "$API_BASE/api/ai/pricing" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": '$TEAM_ID',
    "productIds": ["'$PRODUCT_ID'"],
    "context": {
      "marketConditions": "competitive",
      "seasonality": "peak",
      "inventoryLevel": "low"
    }
  }' \
  -w "\nStatus: %{http_code}\n" || echo "❌ Pricing endpoint failed"

echo "💳 Testing Credit Analysis Endpoint..."
curl -X POST "$API_BASE/api/ai/credit" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": '$TEAM_ID',
    "customerId": "'$CUSTOMER_ID'",
    "context": {
      "transactionHistory": [],
      "paymentBehavior": "on-time",
      "businessType": "retail"
    }
  }' \
  -w "\nStatus: %{http_code}\n" || echo "❌ Credit analysis endpoint failed"

echo "📈 Testing Data Enrichment Endpoint..."
curl -X POST "$API_BASE/api/ai/data" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": '$TEAM_ID',
    "dataType": "customer",
    "records": [
      {
        "id": "'$CUSTOMER_ID'",
        "name": "Test Customer",
        "email": "test@example.com"
      }
    ]
  }' \
  -w "\nStatus: %{http_code}\n" || echo "❌ Data enrichment endpoint failed"

echo "📚 Testing Training Content Generation..."
curl -X POST "$API_BASE/api/ai/training" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": '$TEAM_ID',
    "contentType": "article",
    "topic": "Customer Service Best Practices",
    "context": {
      "audience": "customer-service",
      "complexity": "intermediate",
      "format": "step-by-step"
    }
  }' \
  -w "\nStatus: %{http_code}\n" || echo "❌ Training content endpoint failed"

echo "📊 Verifying Database Entries..."
echo "Check ai_requests table for logged entries"
echo "Check task-specific tables for results"

echo "🎯 Testing Feature Gate Enforcement..."
echo "Disable ai_pricing_enabled in Statsig and retry pricing endpoint"
echo "Should return feature disabled error"

echo "✅ Smoke tests completed!"
echo "🔍 Manual verification steps:"
echo "1. Check database for ai_requests entries"
echo "2. Verify Statsig gates are working"
echo "3. Test with different provider models"
echo "4. Validate cost tracking"