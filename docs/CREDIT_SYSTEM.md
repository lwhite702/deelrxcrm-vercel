# Phase 3 Credit System - Internal Documentation

## Overview

The Credit System enables extending credit to trusted customers with automated billing, payment processing, and risk management. This document covers the internal implementation details, security considerations, and operational procedures.

## Database Schema

### Core Tables

#### `credits`
Primary credit account table storing credit limits and status.

```sql
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  credit_limit INT NOT NULL DEFAULT 0, -- Amount in cents
  available_credit INT NOT NULL DEFAULT 0, -- Amount in cents
  used_credit INT NOT NULL DEFAULT 0, -- Amount in cents
  status credit_status NOT NULL DEFAULT 'active',
  payment_terms payment_terms_enum NOT NULL DEFAULT 'net30',
  late_fee_rate DECIMAL(5,4) DEFAULT 0.0150, -- 1.5% monthly
  grace_period_days INT DEFAULT 5,
  auto_suspend BOOLEAN DEFAULT true,
  stripe_customer_id TEXT, -- For payment processing
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(team_id, customer_id),
  CONSTRAINT valid_credit_amounts CHECK (
    credit_limit >= 0 AND 
    available_credit >= 0 AND 
    used_credit >= 0 AND
    available_credit + used_credit <= credit_limit
  )
);
```

#### `credit_transactions`
All credit-related financial transactions.

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id UUID NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
  team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  transaction_type transaction_type_enum NOT NULL,
  amount INT NOT NULL, -- Amount in cents (positive for charges, negative for payments)
  description TEXT NOT NULL,
  reference_id UUID, -- Order ID, payment ID, etc.
  due_date TIMESTAMP, -- For charges
  status transaction_status_enum NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT, -- For Stripe payments
  idempotency_key TEXT UNIQUE, -- Prevent duplicate transactions
  retry_count INT DEFAULT 0,
  last_attempt_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_credit_transactions_credit_id (credit_id),
  INDEX idx_credit_transactions_team_id (team_id),
  INDEX idx_credit_transactions_due_date (due_date),
  INDEX idx_credit_transactions_status (status)
);
```

### Enums

```sql
-- Credit account status
CREATE TYPE credit_status AS ENUM ('active', 'suspended', 'closed', 'defaulted');

-- Payment terms
CREATE TYPE payment_terms_enum AS ENUM ('due_on_receipt', 'net15', 'net30', 'net60', 'net90');

-- Transaction types
CREATE TYPE transaction_type_enum AS ENUM ('charge', 'payment', 'fee', 'adjustment', 'refund');

-- Transaction status
CREATE TYPE transaction_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
```

## API Implementation

### Authentication & Authorization

All credit endpoints require:
1. **API Key Authentication**: Valid API key in `Authorization: Bearer` header
2. **Team Access**: User must be member of the team with appropriate role
3. **Credit Permissions**: Specific permissions for credit operations

```typescript
// Role-based access control
const CREDIT_PERMISSIONS = {
  'team-admin': ['read', 'write', 'approve', 'suspend'],
  'team-manager': ['read', 'write', 'approve'],
  'team-member': ['read']
} as const;
```

### Endpoint Security

#### Rate Limiting
```typescript
const CREDIT_RATE_LIMITS = {
  '/api/teams/[teamId]/credit': { rpm: 100, rph: 1000 },
  '/api/teams/[teamId]/credit/transactions': { rpm: 60, rph: 600 },
  '/api/teams/[teamId]/credit/charge': { rpm: 30, rph: 300 } // Lower for financial operations
};
```

#### Input Validation
All credit endpoints use Zod schemas for strict input validation:

```typescript
const createCreditAccountSchema = z.object({
  customerId: z.string().uuid(),
  creditLimit: z.number().int().min(0).max(10000000), // Max $100k
  paymentTerms: z.enum(['due_on_receipt', 'net15', 'net30', 'net60', 'net90']),
  lateFeeRate: z.number().min(0).max(0.05).optional(), // Max 5%
  gracePeriodDays: z.number().int().min(0).max(30).optional()
});
```

## Stripe Integration

### SetupIntents for Payment Methods
```typescript
// Create SetupIntent for future payments
const setupIntent = await stripe.setupIntents.create({
  customer: credit.stripeCustomerId,
  usage: 'off_session',
  payment_method_types: ['card'],
  metadata: {
    team_id: teamId,
    credit_id: creditId,
    purpose: 'credit_account'
  }
});
```

### Payment Processing
```typescript
// Charge credit account using saved payment method
const paymentIntent = await stripe.paymentIntents.create({
  amount: transaction.amount,
  currency: 'usd',
  customer: credit.stripeCustomerId,
  payment_method: credit.defaultPaymentMethod,
  confirm: true,
  off_session: true,
  metadata: {
    transaction_id: transaction.id,
    team_id: teamId,
    credit_id: creditId
  }
});
```

### Idempotency
All financial operations use idempotency keys to prevent duplicate charges:

```typescript
const idempotencyKey = `${teamId}-${customerId}-${Date.now()}-${randomString}`;
```

## Background Jobs (Inngest)

### Daily Credit Reminders
```typescript
export const creditRemindersDaily = inngest.createFunction(
  { id: "credit-reminders-daily" },
  { cron: "0 9 * * *" }, // 9 AM daily
  async ({ event, step }) => {
    // Find due/overdue transactions
    // Send reminder emails
    // Update reminder counts
    // Escalate to collections if needed
  }
);
```

### Automated Charges
```typescript
export const creditChargePostdated = inngest.createFunction(
  { id: "credit-charge-postdated" },
  { cron: "0 2 * * *" }, // 2 AM daily
  async ({ event, step }) => {
    // Find scheduled charges due today
    // Process payments via Stripe
    // Update transaction status
    // Handle failures with retry logic
  }
);
```

## Risk Management

### Credit Limits
- **Default Limits**: New accounts start with conservative limits
- **Automatic Increases**: Based on payment history and tenure
- **Manual Reviews**: Required for limits above $10,000
- **Industry Standards**: Reference industry benchmarks for limit setting

### Payment Monitoring
```typescript
// Credit risk scoring
const calculateRiskScore = (creditAccount: CreditAccount) => {
  const paymentHistory = getPaymentHistory(creditAccount.id);
  const avgDaysLate = paymentHistory.avgDaysLate;
  const latePaymentRate = paymentHistory.latePaymentRate;
  const creditUtilization = creditAccount.usedCredit / creditAccount.creditLimit;
  
  return (avgDaysLate * 0.4) + (latePaymentRate * 0.4) + (creditUtilization * 0.2);
};
```

### Auto-Suspension Rules
```typescript
const SUSPENSION_RULES = {
  overLimit: true, // Suspend if over credit limit
  daysOverdue: 60, // Suspend after 60 days overdue
  consecutiveLatePayments: 3, // Suspend after 3 consecutive late payments
  riskScoreThreshold: 75 // Suspend if risk score > 75
};
```

## Security Considerations

### Data Encryption
- **At Rest**: All financial data encrypted using AES-256-GCM
- **In Transit**: TLS 1.3 for all communications
- **Key Management**: Separate encryption keys for different data types

### Access Logging
```typescript
// Log all credit operations
const logCreditOperation = async (operation: CreditOperation) => {
  await db.insert(auditLogs).values({
    userId: operation.userId,
    teamId: operation.teamId,
    action: operation.action,
    resource: 'credit',
    resourceId: operation.creditId,
    changes: operation.changes,
    ipAddress: operation.ipAddress,
    userAgent: operation.userAgent,
    timestamp: new Date()
  });
};
```

### PCI Compliance
- **No Card Storage**: Never store credit card numbers in our database
- **Stripe Tokenization**: Use Stripe tokens for all payment processing
- **Minimal PII**: Store only necessary customer information
- **Regular Audits**: Quarterly security audits of credit system

## Error Handling

### Stripe Error Handling
```typescript
const handleStripeError = (error: Stripe.StripeError, transaction: CreditTransaction) => {
  switch (error.code) {
    case 'card_declined':
      return updateTransactionStatus(transaction.id, 'failed', 'Card declined');
    case 'insufficient_funds':
      return scheduleRetry(transaction.id, '24_hours');
    case 'authentication_required':
      return requestCustomerAuthentication(transaction.id);
    default:
      return logErrorAndNotifyAdmin(error, transaction);
  }
};
```

### Retry Logic
```typescript
const RETRY_SCHEDULE = [
  { attempt: 1, delay: '1 hour' },
  { attempt: 2, delay: '6 hours' },
  { attempt: 3, delay: '24 hours' },
  { attempt: 4, delay: '72 hours' },
  { attempt: 5, delay: 'manual' } // Manual intervention required
];
```

## Monitoring & Alerts

### Key Metrics
- **Credit Utilization**: Average utilization across all accounts
- **Collection Rate**: Percentage of receivables collected within terms
- **Days Sales Outstanding (DSO)**: Average collection period
- **Default Rate**: Percentage of accounts that default
- **Payment Success Rate**: Stripe payment success rate

### Alerting Thresholds
```typescript
const ALERT_THRESHOLDS = {
  highCreditUtilization: 0.85, // 85% utilization
  highDSO: 45, // 45 days average collection
  lowPaymentSuccessRate: 0.90, // Below 90% success rate
  highDefaultRate: 0.05 // Above 5% default rate
};
```

## Backup & Recovery

### Database Backups
- **Frequency**: Hourly incremental, daily full backups
- **Retention**: 30 days for incremental, 1 year for daily
- **Encryption**: All backups encrypted at rest
- **Testing**: Monthly restore tests

### Disaster Recovery
- **RTO**: 4 hours maximum recovery time
- **RPO**: 1 hour maximum data loss
- **Failover**: Automatic failover to backup region
- **Data Integrity**: Checksums and validation on all financial data

## Compliance & Auditing

### SOX Compliance
- **Segregation of Duties**: Separate roles for credit approval and processing
- **Audit Trail**: Complete audit trail of all financial transactions
- **Controls Testing**: Quarterly testing of internal controls
- **Documentation**: Comprehensive documentation of all processes

### Regular Audits
- **Internal**: Monthly reconciliation of credit accounts
- **External**: Annual audit by certified public accountant
- **Penetration Testing**: Quarterly security testing
- **Compliance Review**: Semi-annual compliance review

## Troubleshooting

### Common Issues

#### Payment Failures
```bash
# Check payment failure reasons
SELECT 
  ct.id,
  ct.description,
  ct.amount,
  ct.status,
  ct.stripe_payment_intent_id,
  ct.retry_count,
  ct.last_attempt_at
FROM credit_transactions ct
WHERE ct.status = 'failed'
  AND ct.created_at > NOW() - INTERVAL '7 days'
ORDER BY ct.last_attempt_at DESC;
```

#### Credit Limit Issues
```bash
# Check accounts over credit limit
SELECT 
  c.id,
  c.team_id,  
  c.customer_id,
  c.credit_limit,
  c.used_credit,
  c.available_credit,
  c.status
FROM credits c
WHERE c.used_credit > c.credit_limit
  AND c.status = 'active';
```

### Debug Commands
```bash
# Check transaction history for a credit account
npm run debug:credit-history -- --credit-id="credit_123"

# Recalculate credit balances
npm run debug:recalculate-balances -- --team-id="team_123"

# Test Stripe payment processing
npm run debug:test-stripe -- --customer-id="cust_123"
```

This documentation should be updated as the credit system evolves and new features are added.