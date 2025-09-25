/**
 * Server-side PostHog Configuration
 * 
 * This file contains server-side only PostHog configuration
 * and should only be imported in server-side code.
 */

import 'server-only';
import { PostHog } from 'posthog-node';

// Server-side PostHog instance
let posthogServer: PostHog | null = null;

/**
 * Initialize server-side PostHog client
 */
export function getServerPostHog(): PostHog {
  if (!posthogServer) {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host =
      process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

    if (!key) {
      throw new Error(
        'NEXT_PUBLIC_POSTHOG_KEY environment variable is required'
      );
    }

    posthogServer = new PostHog(key, {
      host,
      // Enable feature flags
      personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY,
      // Batch events for better performance
      flushAt: 20,
      flushInterval: 30000, // 30 seconds
    });
  }

  return posthogServer;
}

/**
 * Check if PostHog is properly configured
 */
export function isPostHogConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST
  );
}