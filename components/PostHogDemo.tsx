/**
 * PostHog Analytics Demo Component
 *
 * This component demonstrates how to use PostHog analytics in your application.
 * You can add this to any page to test the integration.
 */

'use client';

import React from 'react';
import {
  trackEvent,
  identifyUser,
  usePostHog,
  getFeatureFlag,
  isFeatureFlagEnabled,
} from '../lib/analytics/posthog-provider';
import { POSTHOG_EVENTS } from '../lib/analytics/posthog-config';

export function PostHogDemo() {
  const posthog = usePostHog();

  const handleTrackEvent = () => {
    trackEvent(POSTHOG_EVENTS.USER_SIGNED_UP, {
      demo_mode: true,
      signup_method: 'email',
      utm_source: 'demo_page',
      timestamp: new Date(),
    });

    console.log('✅ Event tracked:', POSTHOG_EVENTS.USER_SIGNED_UP);
  };

  const handleIdentifyUser = () => {
    identifyUser('demo-user-123', {
      email: 'demo@example.com',
      name: 'Demo User',
      subscription_plan: 'pro',
      demo_mode: true,
    });

    console.log('✅ User identified: demo-user-123');
  };

  const handleDashboardView = () => {
    trackEvent(POSTHOG_EVENTS.DASHBOARD_VIEWED, {
      demo_mode: true,
      dashboard_type: 'main',
      widgets_visible: 8,
    });

    console.log('✅ Dashboard view tracked');
  };

  const handleCustomerCreated = () => {
    trackEvent(POSTHOG_EVENTS.CUSTOMER_CREATED, {
      demo_mode: true,
      customer_type: 'enterprise',
      acquisition_channel: 'demo',
      initial_value: 25000,
    });

    console.log('✅ Customer creation tracked');
  };

  const checkFeatureFlag = () => {
    const flagValue = getFeatureFlag('demo-feature-flag');
    const isEnabled = isFeatureFlagEnabled('demo-feature-flag');

    console.log('🚩 Feature flag value:', flagValue);
    console.log('🚩 Feature flag enabled:', isEnabled);

    alert(`Feature flag: ${flagValue || 'not set'}, Enabled: ${isEnabled}`);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        🔍 PostHog Analytics Demo
      </h2>

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">
            User Identification
          </h3>
          <button
            onClick={handleIdentifyUser}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
          >
            Identify Demo User
          </button>
          <p className="text-sm text-blue-600 mt-2">
            This identifies a user with properties for segmentation.
          </p>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Event Tracking</h3>
          <div className="space-x-2">
            <button
              onClick={handleTrackEvent}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Track Signup
            </button>
            <button
              onClick={handleDashboardView}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Track Dashboard View
            </button>
            <button
              onClick={handleCustomerCreated}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Track Customer Created
            </button>
          </div>
          <p className="text-sm text-green-600 mt-2">
            These track different user actions with contextual properties.
          </p>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-2">Feature Flags</h3>
          <button
            onClick={checkFeatureFlag}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
          >
            Check Feature Flag
          </button>
          <p className="text-sm text-purple-600 mt-2">
            Test feature flag functionality for A/B testing.
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">PostHog Instance</h3>
          <p className="text-sm text-gray-600">
            PostHog instance available:{' '}
            <span className="font-mono">{posthog ? '✅ Yes' : '❌ No'}</span>
          </p>
          <p className="text-sm text-gray-600">
            Open your browser's developer console to see the tracking logs.
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">
          📊 View Analytics
        </h3>
        <p className="text-sm text-yellow-700">
          Visit your{' '}
          <a
            href="https://us.i.posthog.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            PostHog Dashboard
          </a>{' '}
          to see the events in real-time.
        </p>
      </div>
    </div>
  );
}

export default PostHogDemo;
