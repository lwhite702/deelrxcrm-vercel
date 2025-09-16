import Stripe from 'stripe';

import { handleStripeEvent } from '../../server/stripe/handlers';

export const config = {
  runtime: 'nodejs18.x'
};

export const dynamic = 'force-dynamic';

let stripeClient: Stripe | null = null;

/**
 * Retrieves the Stripe client instance.
 *
 * This function checks if the stripeClient is already initialized. If it is, the existing instance is returned.
 * If not, it retrieves the STRIPE_SECRET_KEY from the environment variables and throws an error if it is not configured.
 * A new Stripe client is then created with the provided secret and a specified API version before being returned.
 */
function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  stripeClient = new Stripe(secret, {
    apiVersion: '2023-10-16'
  });

  return stripeClient;
}

/**
 * Handles incoming Stripe webhook requests.
 *
 * This function first checks if the request method is POST and validates the presence of the Stripe signature in the headers.
 * It retrieves the raw body of the request and the webhook secret from the environment variables.
 * The Stripe client is then configured, and the event is constructed from the raw body, signature, and webhook secret.
 * Finally, it processes the event using the handleStripeEvent function, handling any errors that may occur during the process.
 *
 * @param request - The incoming HTTP request object.
 * @returns A Response indicating the result of the webhook handling.
 * @throws Response If the request method is not POST, if the signature is missing, if the webhook secret is not configured,
 *                  if the Stripe client cannot be configured, or if the event handling fails.
 */
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'POST' }
    });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  const rawBody = await request.text();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return new Response('Missing STRIPE_WEBHOOK_SECRET', { status: 500 });
  }

  let stripe: Stripe;
  try {
    stripe = getStripeClient();
  } catch (error) {
    console.error('Stripe client configuration error', error);
    return new Response('Stripe not configured', { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid signature';
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch (error) {
    console.error('Stripe webhook handler failed', error);
    return new Response('Webhook handler failed', { status: 500 });
  }

  return new Response('ok');
}
