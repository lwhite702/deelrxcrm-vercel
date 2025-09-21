import type Stripe from 'stripe';

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'payment_intent.succeeded':
    case 'invoice.payment_succeeded':
      // Integrate business logic here, such as marking invoices as paid.
      break;
    default:
      break;
  }
}
