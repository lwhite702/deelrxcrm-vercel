/**
 * PostHog Provider Component
 * 
 * React provider component for client-side PostHog analytics integration.
 * This integrates with the Phase 6 Product Analytics System.
 */

'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PostHogReactProvider } from 'posthog-js/react';
import { posthogConfig, isPostHogConfigured, POSTHOG_USER_PROPERTIES } from './posthog-config';

// Initialize PostHog on the client side
if (typeof window !== 'undefined' && isPostHogConfigured()) {
  posthog.init(posthogConfig.key, {
    api_host: posthogConfig.host,
    capture_pageview: posthogConfig.options.capture_pageview,
    capture_pageleave: posthogConfig.options.capture_pageleave,
    disable_session_recording: posthogConfig.options.disable_session_recording,
    autocapture: posthogConfig.options.autocapture,
    capture_performance: posthogConfig.options.capture_performance,
    respect_dnt: posthogConfig.options.respect_dnt,
    bootstrap: posthogConfig.options.bootstrap,
    cross_subdomain_cookie: posthogConfig.options.cross_subdomain_cookie,
    secure_cookie: posthogConfig.options.secure_cookie,
    persistence: 'localStorage+cookie' as const,
  });
}

/**
 * PostHog Provider Component
 * Wraps the application to provide PostHog analytics throughout the app
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!isPostHogConfigured()) {
      console.warn('PostHog not configured. Analytics will be disabled.');
      return;
    }

    // Track initial page load
    if (typeof window !== 'undefined') {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
      });
    }
  }, []);

  if (!isPostHogConfigured()) {
    return <>{children}</>;
  }

  return (
    <PostHogReactProvider client={posthog}>
      {children}
    </PostHogReactProvider>
  );
}

/**
 * Hook to access PostHog instance
 */
export function usePostHog() {
  if (!isPostHogConfigured()) {
    return null;
  }
  return posthog;
}

/**
 * Helper function to track events consistently
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (!isPostHogConfigured()) {
    return;
  }
  
  posthog.capture(eventName, {
    timestamp: new Date().toISOString(),
    ...properties,
  });
}

/**
 * Helper function to identify users
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (!isPostHogConfigured()) {
    return;
  }
  
  posthog.identify(userId, properties);
}

/**
 * Helper function to set user properties
 */
export function setUserProperties(properties: Record<string, any>) {
  if (!isPostHogConfigured()) {
    return;
  }
  
  posthog.people.set(properties);
}

/**
 * Helper function to track page views
 */
export function trackPageView(pageName?: string, properties?: Record<string, any>) {
  if (!isPostHogConfigured()) {
    return;
  }
  
  posthog.capture('$pageview', {
    $current_url: window.location.href,
    page_name: pageName,
    ...properties,
  });
}

/**
 * Helper function to get feature flags
 */
export function getFeatureFlag(flagKey: string, defaultValue?: any) {
  if (!isPostHogConfigured()) {
    return defaultValue;
  }
  
  return posthog.getFeatureFlag(flagKey, defaultValue);
}

/**
 * Helper function to check if feature flag is enabled
 */
export function isFeatureFlagEnabled(flagKey: string): boolean {
  if (!isPostHogConfigured()) {
    return false;
  }
  
  return posthog.isFeatureEnabled(flagKey) ?? false;
}

export default PostHogProvider;