# AI Layer Documentation

## Overview

DeelRx CRM integrates a comprehensive AI layer providing intelligent recommendations and insights across multiple business domains. The AI system is built with safety guardrails, feature gates, and human oversight requirements.

## Architecture

### Core Components

- **LLM Service** (`legacy-replit/server/llm/llm-service.ts`)
  - Unified interface for multiple AI providers
  - Request/response logging and monitoring
  - Cost tracking and token usage analytics
  - Encryption for sensitive data

- **AI Providers** (`lib/db/schema.ts` - `aiProviders` table)
  - OpenAI (GPT-4o-mini default)
  - Configurable model selection
  - Provider-specific configuration management

### Intelligence Services

#### 1. Pricing Intelligence
**File:** `legacy-replit/server/llm/pricing-intelligence.ts`

**Capabilities:**
- Dynamic pricing recommendations based on:
  - Product catalog analysis
  - Historical sales data
  - Geographic market conditions
  - Customer purchase patterns
- Market position analysis
- Profit margin optimization

**Endpoints:**
- `POST /api/llm/pricing/analyze` - Analyze pricing for product/customer
- `GET /api/llm/pricing/suggestions` - Get pricing suggestions
- `POST /api/llm/pricing/suggestions/:id/apply` - Apply pricing recommendation

**Guardrails:**
- Never override final human-set prices without approval
- No PII leakage in recommendations
- Transparent justification required for all suggestions

#### 2. Credit Intelligence
**File:** `legacy-replit/server/llm/credit-intelligence.ts`

**Capabilities:**
- Credit risk assessment based on:
  - Transaction history analysis
  - Payment pattern recognition
  - Past due flag evaluation
  - Customer communication sentiment
- Credit limit recommendations
- Dunning strategy templates
- Adaptive messaging generation

**Endpoints:**
- `POST /api/llm/credit/analyze` - Analyze customer credit risk
- `GET /api/llm/credit/insights` - Get credit insights
- `POST /api/llm/credit/adaptive-message` - Generate personalized messages

**Guardrails:**
- Human approval required for adverse credit decisions
- Transparent explanations for all risk assessments
- No automated credit limit changes without oversight

#### 3. Data Intelligence
**File:** `legacy-replit/server/llm/data-intelligence.ts`

**Capabilities:**
- Data enrichment and normalization:
  - Free text/voice note processing
  - Email snippet extraction
  - File upload content analysis
- Entity recognition (customers, addresses, SKUs)
- Duplicate detection and merge suggestions
- Data cleaning with compliance justification

**Endpoints:**
- `POST /api/llm/data/enrich` - Enrich data records
- `POST /api/llm/data/enrichments/:id/apply` - Apply enrichment
- `POST /api/llm/data/clean` - Clean data records
- `GET /api/llm/data/mappings` - Get product mappings

**Guardrails:**
- All changes require explicit user confirmation
- Audit trail for all data modifications
- Compliance notes for pharmaceutical regulations

#### 4. Training Intelligence
**File:** `legacy-replit/server/llm/training-intelligence.ts`

**Capabilities:**
- Interactive training content generation
- Onboarding plan creation based on user roles
- Adaptive quiz generation
- Training session analytics
- Knowledge assessment tools

**Endpoints:**
- `POST /api/llm/training/content/generate` - Generate training content
- `POST /api/llm/training/onboarding-plan` - Create onboarding plans
- `POST /api/llm/training/quiz/generate` - Generate adaptive quizzes

**Guardrails:**
- Content accuracy verification required
- Role-appropriate content filtering
- Progress tracking with human oversight

## Feature Gates & Controls

### Statsig Integration
**File:** `lib/security/featureGates.ts`

**Available Gates:**
```typescript
// LLM/AI Features
LLM_PRICING_ENABLED: 'llm_pricing_enabled'
LLM_CREDIT_ENABLED: 'llm_credit_enabled' 
LLM_DATA_ENABLED: 'llm_data_enabled'
LLM_TRAINING_ENABLED: 'llm_training_enabled'

// Kill Switches (default TRUE, turn OFF to disable)
KILL_AI_ENDPOINTS: 'kill_ai_endpoints'
```

### Progressive Rollout
- Gradual feature enablement per tenant
- A/B testing capabilities for AI features
- Kill switches for emergency shutdowns
- Usage monitoring and alerts

## Database Schema

### AI Providers (`aiProviders`)
```sql
CREATE TABLE ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- openai, anthropic, mistral
  model VARCHAR(100) NOT NULL, -- gpt-4o, claude-3-sonnet
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB, -- apiKey, endpoint, maxTokens, temperature
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### AI Requests (`aiRequests`)
```sql
CREATE TABLE ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id INTEGER NOT NULL REFERENCES teams(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  provider_id UUID REFERENCES ai_providers(id),
  intelligence_type VARCHAR(50), -- pricing, credit, data, training
  status VARCHAR(20), -- processing, completed, failed
  prompt TEXT ENCRYPTED,
  response TEXT ENCRYPTED,
  tokens_used INTEGER,
  cost_cents INTEGER,
  processing_time_ms INTEGER,
  confidence VARCHAR(10), -- low, medium, high
  metadata JSONB,
  human_override BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Security & Compliance

### Data Protection
- Field-level encryption for sensitive prompts/responses
- PII detection and masking in AI requests
- Audit logging for all AI operations
- Data retention policies for AI-generated content

### Access Controls
- Role-based access to AI features
- Team-scoped AI requests and responses
- Rate limiting per tenant/user
- API key rotation and management

### Monitoring
- Real-time cost tracking
- Token usage analytics
- Response quality metrics
- Error rate monitoring
- Feature gate effectiveness tracking

## Development Guidelines

### Adding New Intelligence Services
1. Create service class in `legacy-replit/server/llm/`
2. Implement standardized prompt templates
3. Add feature gate configuration
4. Create API routes with proper validation
5. Add comprehensive tests
6. Update documentation

### Prompt Engineering Best Practices
- Use structured JSON responses
- Include confidence scoring
- Provide transparent justifications
- Implement safety guardrails
- Test with edge cases

### Testing AI Features
- Use `scripts/AI_SMOKE.sh` for integration testing
- Mock AI responses for unit tests
- Test feature gate toggling
- Validate cost tracking accuracy
- Verify security controls

## Monitoring & Alerts

### Key Metrics
- AI request volume and success rates
- Cost per request and monthly spending
- Response quality and confidence scores
- Feature adoption rates
- Error rates by intelligence type

### Alerting Thresholds
- Monthly cost exceeding budget
- Error rate above 5%
- Response time above 30 seconds
- Unusual usage patterns
- Feature gate failures

## Troubleshooting

### Common Issues
1. **High Costs**: Check token usage patterns, optimize prompts
2. **Low Confidence**: Review training data, adjust model parameters  
3. **Slow Responses**: Monitor provider latency, consider model changes
4. **Feature Gate Issues**: Verify Statsig configuration and connectivity

### Debug Tools
- AI request logs in database
- Statsig dashboard for feature gates
- Sentry for error tracking
- Custom metrics for performance monitoring

## Future Enhancements

### Planned Features
- Multi-provider load balancing
- Custom model fine-tuning
- Advanced prompt optimization
- Real-time recommendation engines
- Industry-specific compliance modules

### Research Areas
- Federated learning for tenant data
- Edge AI for real-time responses
- Advanced NLP for pharmaceutical compliance
- Automated model evaluation and selection