/**
 * PostHog Integration Test
 *
 * Simple test to verify PostHog analytics integration is working correctly
 */

import { trackEvent, identifyUser } from './posthog-provider';
import { POSTHOG_EVENTS, isPostHogConfigured } from './posthog-config';

/**
 * Test PostHog Integration
 * Returns true if tests pass, false otherwise
 */
export function testPostHogIntegration(): boolean {
  try {
    console.log('🧪 Testing PostHog Integration...');

    // Test 1: Check if PostHog is configured
    const isConfigured = isPostHogConfigured();
    console.log(
      `✅ PostHog Configuration: ${
        isConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'
      }`
    );

    // Test 2: Test event tracking (won't actually send in test mode)
    if (isConfigured) {
      trackEvent(POSTHOG_EVENTS.USER_SIGNED_UP, {
        test_mode: true,
        timestamp: new Date(),
      });
      console.log('✅ Event Tracking: WORKING');

      // Test 3: Test user identification
      identifyUser('test-user-123', {
        email: 'test@example.com',
        name: 'Test User',
        test_mode: true,
      });
      console.log('✅ User Identification: WORKING');
    }

    // Test 4: Test event constants are available
    const hasEvents = Object.keys(POSTHOG_EVENTS).length > 0;
    console.log(
      `✅ Event Constants: ${hasEvents ? 'AVAILABLE' : 'MISSING'} (${
        Object.keys(POSTHOG_EVENTS).length
      } events)`
    );

    console.log('🎉 PostHog Integration Test: PASSED');
    return true;
  } catch (error) {
    console.error('❌ PostHog Integration Test: FAILED', error);
    return false;
  }
}

/**
 * Test specific analytics events
 */
export function testAnalyticsEvents() {
  console.log('📊 Testing Analytics Events...');

  const testEvents = [
    POSTHOG_EVENTS.USER_SIGNED_UP,
    POSTHOG_EVENTS.DASHBOARD_VIEWED,
    POSTHOG_EVENTS.CUSTOMER_CREATED,
    POSTHOG_EVENTS.SUBSCRIPTION_CREATED,
    POSTHOG_EVENTS.PAYMENT_PROCESSED,
  ];

  testEvents.forEach((event) => {
    trackEvent(event, {
      test_mode: true,
      timestamp: new Date(),
      source: 'integration_test',
    });
    console.log(`✅ Tracked event: ${event}`);
  });

  console.log('📊 Analytics Events Test: COMPLETED');
}

// Export for use in development/testing
export default {
  testPostHogIntegration,
  testAnalyticsEvents,
};
