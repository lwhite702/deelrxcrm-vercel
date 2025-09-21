# Payments (Stripe Integration)

This project integrates Stripe for payments with webhook handling for real-time event processing.

## Setup

### 1. Create Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Complete account verification
3. Get your API keys from Dashboard → Developers → API keys

### 2. Configure Environment Variables

```bash
# Test keys (start with sk_test_ and pk_test_)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Set Up Webhook Endpoint

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for (recommended: all events)
5. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

## Local Development

### Start the Application

```bash
npm run dev:next
```

### Test Webhooks Locally

Use Stripe CLI to forward events to your local server:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login

# Forward webhooks to local development server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The CLI will output a webhook signing secret - copy this to your `.env` file.

## Test Payment Methods

### Successful Cards

- `4242 4242 4242 4242` - Visa (any future expiry, any CVC)
- `5555 5555 5555 4444` - Mastercard
- `3782 822463 10005` - American Express

### Declined Cards

- `4000 0000 0000 0002` - Generic decline
- `4000 0000 0000 9995` - Insufficient funds
- `4000 0000 0000 9987` - Lost card

### 3D Secure Testing

- `4000 0025 0000 3155` - Requires 3D Secure authentication
- `4000 0027 6000 3184` - Requires 3D Secure (decline)

## Webhook Events

The webhook handler at `/api/webhooks/stripe` processes these events:

- `payment_intent.succeeded` - Payment completed successfully
- `payment_intent.payment_failed` - Payment failed
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription cancelled
- `invoice.payment_succeeded` - Invoice paid
- `invoice.payment_failed` - Invoice payment failed

## Code Structure

- **Webhook Route**: `app/api/webhooks/stripe/route.ts`
- **Event Handlers**: `server/stripe/handlers.ts`
- **Stripe Client**: Initialized with signature verification

## Security

- All webhook payloads are verified using Stripe's signature
- Raw request body is required for signature validation
- Events are processed idempotently using Stripe's event ID

## Production Deployment

1. Use live API keys (start with `sk_live_` and `pk_live_`)
2. Update webhook endpoint URL to production domain
3. Verify SSL certificate is valid
4. Test with real payment methods in small amounts

## Troubleshooting

- **Webhook signature failed**: Check `STRIPE_WEBHOOK_SECRET` matches endpoint
- **Events not received**: Verify webhook URL and ensure it's publicly accessible
- **Payment failures**: Check Stripe Dashboard logs for detailed error messages
- **Local testing issues**: Ensure Stripe CLI is forwarding to correct port
