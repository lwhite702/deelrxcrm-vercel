/**
 * Dashboard Analytics Tracking
 *
 * This component automatically tracks dashboard page views and user interactions.
 * It's designed to be included in the main dashboard page.
 */

'use client';

import { useEffect } from 'react';
import { trackEvent } from '../../lib/analytics/posthog-provider';
import { POSTHOG_EVENTS } from '../../lib/analytics/posthog-config';

export default function DashboardAnalytics() {
  useEffect(() => {
    // Track dashboard page view
    trackEvent(POSTHOG_EVENTS.DASHBOARD_VIEWED, {
      page: 'main_dashboard',
      timestamp: new Date(),
      source: 'direct_navigation',
    });

    // Track dashboard engagement after 10 seconds
    const engagementTimer = setTimeout(() => {
      trackEvent(POSTHOG_EVENTS.DASHBOARD_WIDGET_CLICKED, {
        engagement_type: 'time_spent',
        duration_seconds: 10,
        page: 'main_dashboard',
      });
    }, 10000);

    return () => {
      clearTimeout(engagementTimer);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
