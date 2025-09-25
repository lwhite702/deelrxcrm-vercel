/**
 * Analytics Integration Setup
 *
 * This file integrates PostHog with the existing Product Analytics system
 * to provide comprehensive tracking for the DeelRx CRM application.
 */

'use client';

import React from 'react';
import { PostHogProvider } from './posthog-provider';
import { AnalyticsProvider } from './product-analytics';

/**
 * Combined Analytics Provider
 * Wraps the application with both PostHog and Vercel Analytics
 */
export function CombinedAnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PostHogProvider>
      <AnalyticsProvider>{children}</AnalyticsProvider>
    </PostHogProvider>
  );
}

/**
 * Analytics hooks and utilities for use throughout the app
 */
export {
  usePostHog,
  trackEvent,
  identifyUser,
  setUserProperties,
  trackPageView,
  getFeatureFlag,
  isFeatureFlagEnabled,
} from './posthog-provider';

export {
  ANALYTICS_EVENTS,
  trackCRMAction,
  trackUserJourney,
  trackFeatureAdoption,
  trackBusinessGoal,
  default as analytics,
} from './product-analytics';

export {
  POSTHOG_EVENTS,
  POSTHOG_USER_PROPERTIES,
  isPostHogConfigured,
} from './posthog-config';

/**
 * Initialize analytics for the application
 * Call this in your root layout or main app component
 */
export async function initializeAnalytics(
  userId?: string,
  userProperties?: any
) {
  const { default: analytics } = await import('./product-analytics');

  if (userId && userProperties) {
    await analytics.initialize(userId, userProperties);
  } else {
    await analytics.initialize();
  }
}

export default CombinedAnalyticsProvider;
