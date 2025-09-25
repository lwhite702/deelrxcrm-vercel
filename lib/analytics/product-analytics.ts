/**
 * Product Analytics Configuration
 * 
 * This module provides comprehensive product analytics tracking for DeelRx CRM, 
 * including user behavior analysis, feature usage tracking, and business metrics collection.
 * 
 * Analytics Providers Integrated:
 * 1. Vercel Analytics - Performance and Core Web Vitals
 * 2. PostHog - Product analytics and user behexport const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return React.createElement(
    React.Fragment,
    null,
    children,
    React.createElement(Analytics),
    React.createElement(SpeedInsights)
  );
}; Custom Events - Business-specific metrics
 * 4. Performance Monitoring - Real-time performance tracking
 * 
 * Features:
 * - User journey tracking
 * - Feature adoption metrics
 * - Conversion funnel analysis
 * - Retention and churn analysis
 * - Performance correlation with user behavior
 * - Real-time dashboard metrics
 * - Privacy-compliant tracking
 * 
 * Created: September 2025
 */

import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import {
  trackEvent,
  identifyUser,
  setUserProperties,
  trackPageView,
  getFeatureFlag,
  isFeatureFlagEnabled,
} from './posthog-provider';
import {
  POSTHOG_EVENTS,
  POSTHOG_USER_PROPERTIES,
  isPostHogConfigured,
} from './posthog-config';

// Event Types for Type Safety - using PostHog events
export const ANALYTICS_EVENTS = POSTHOG_EVENTS;

// User Properties for Segmentation
export interface UserProperties {
  user_id: string;
  email: string;
  organization_id: string;
  organization_name: string;
  user_role: 'admin' | 'manager' | 'sales_rep' | 'read_only';
  plan_type: 'free' | 'starter' | 'professional' | 'enterprise';
  signup_date: string;
  total_contacts: number;
  total_deals: number;
  team_size: number;
  industry?: string;
  monthly_revenue?: number;
}

// Event Properties for Rich Context
export interface EventProperties {
  [key: string]: string | number | boolean | Date | undefined;
  timestamp?: Date;
  user_agent?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

class ProductAnalytics {
  private initialized = false;
  private eventQueue: Array<{ event: string; properties?: EventProperties }> =
    [];

  // Initialize analytics providers
  async initialize(userId?: string, userProperties?: Partial<UserProperties>) {
    if (this.initialized) return;

    try {
      // Check if PostHog is configured
      if (!isPostHogConfigured()) {
        console.warn('PostHog not configured - analytics disabled');
        return;
      }

      // Identify user if provided
      if (userId && userProperties) {
        this.identifyUser(userId, userProperties);
      }

      // Process queued events
      this.processEventQueue();

      this.initialized = true;

      console.log('✅ Product Analytics initialized with PostHog');
    } catch (error) {
      console.error('❌ Failed to initialize analytics:', error);
    }
  }

  // Identify user for personalized tracking
  identifyUser(userId: string, properties: Partial<UserProperties>) {
    if (!isPostHogConfigured()) {
      console.warn('Analytics not configured');
      return;
    }

    // Use PostHog provider functions
    identifyUser(userId, {
      [POSTHOG_USER_PROPERTIES.EMAIL]: properties.email,
      [POSTHOG_USER_PROPERTIES.NAME]: properties.organization_name,
      [POSTHOG_USER_PROPERTIES.ROLE]: properties.user_role,
      [POSTHOG_USER_PROPERTIES.SUBSCRIPTION_PLAN]: properties.plan_type,
      [POSTHOG_USER_PROPERTIES.CREATED_AT]:
        properties.signup_date || new Date().toISOString(),
      [POSTHOG_USER_PROPERTIES.TEAM_ID]: properties.organization_id,
      [POSTHOG_USER_PROPERTIES.TOTAL_CUSTOMERS]: properties.total_contacts,
      [POSTHOG_USER_PROPERTIES.TOTAL_REVENUE]: properties.monthly_revenue,
    });

    // Track user identification event
    this.trackEvent(ANALYTICS_EVENTS.USER_SIGNED_UP, {
      user_role: properties.user_role,
      plan_type: properties.plan_type,
      organization_name: properties.organization_name,
    });
  }

  // Track custom events with rich context
  trackEvent(event: string, properties?: EventProperties) {
    const eventData = {
      event,
      properties: {
        ...properties,
        timestamp: new Date(),
        user_agent:
          typeof window !== 'undefined'
            ? window.navigator.userAgent
            : undefined,
        referrer: typeof window !== 'undefined' ? document.referrer : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    };

    if (!this.initialized || !isPostHogConfigured()) {
      // Queue events until analytics is initialized
      this.eventQueue.push(eventData);
      return;
    }

    try {
      trackEvent(event, eventData.properties);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // Track page views with context
  trackPageView(pageName: string, properties?: EventProperties) {
    this.trackEvent('page_viewed', {
      page_name: pageName,
      ...properties,
    });
  }

  // Track feature usage with adoption metrics
  trackFeatureUsage(
    feature: string,
    action: string,
    properties?: EventProperties
  ) {
    this.trackEvent('feature_used', {
      feature_name: feature,
      action,
      ...properties,
    });
  }

  // Track business metrics for revenue intelligence
  trackBusinessMetric(
    metric: string,
    value: number,
    properties?: EventProperties
  ) {
    this.trackEvent('business_metric', {
      metric_name: metric,
      metric_value: value,
      ...properties,
    });
  }

  // Track user journey milestones
  trackMilestone(milestone: string, properties?: EventProperties) {
    this.trackEvent('user_milestone', {
      milestone_name: milestone,
      ...properties,
    });
  }

  // Track performance metrics correlated with user behavior
  trackPerformanceMetric(
    metric: string,
    value: number,
    context?: EventProperties
  ) {
    this.trackEvent('performance_metric', {
      metric_name: metric,
      metric_value: value,
      performance_context: JSON.stringify(context || {}),
    });
  }

  // Update user properties for progressive profiling
  updateUserProperties(properties: Partial<UserProperties>) {
    if (!isPostHogConfigured()) {
      console.warn('Analytics not configured');
      return;
    }

    setUserProperties(properties);
  }

  // Track A/B test participation
  trackExperiment(
    experimentName: string,
    variant: string,
    properties?: EventProperties
  ) {
    this.trackEvent('experiment_viewed', {
      experiment_name: experimentName,
      variant,
      ...properties,
    });

    // Set as user property for consistent experience
    setUserProperties({
      [`experiment_${experimentName}`]: variant,
    });
  }

  // Track conversion funnel steps
  trackFunnelStep(
    funnelName: string,
    step: string,
    properties?: EventProperties
  ) {
    this.trackEvent('funnel_step', {
      funnel_name: funnelName,
      step_name: step,
      ...properties,
    });
  }

  // Process queued events
  private processEventQueue() {
    while (this.eventQueue.length > 0) {
      const eventData = this.eventQueue.shift();
      if (eventData) {
        this.trackEvent(eventData.event, eventData.properties);
      }
    }
  }

  // Reset user session (for logout)
  reset() {
    // This will be handled by the PostHog provider
    console.log('User session reset - handled by PostHog provider');
  }

  // Get feature flags for A/B testing
  getFeatureFlag(flagName: string): boolean | string | undefined {
    return getFeatureFlag(flagName);
  }

  // Check if feature flag is enabled
  isFeatureFlagEnabled(flagName: string): boolean {
    const flag = this.getFeatureFlag(flagName);
    return flag === true || flag === 'true';
  }
}

// Singleton instance
export const analytics = new ProductAnalytics();

// React hook for analytics in components
export const useAnalytics = () => {
  const trackEvent = (event: string, properties?: EventProperties) => {
    analytics.trackEvent(event, properties);
  };

  const trackPageView = (pageName: string, properties?: EventProperties) => {
    analytics.trackPageView(pageName, properties);
  };

  const trackFeatureUsage = (
    feature: string,
    action: string,
    properties?: EventProperties
  ) => {
    analytics.trackFeatureUsage(feature, action, properties);
  };

  const trackBusinessMetric = (
    metric: string,
    value: number,
    properties?: EventProperties
  ) => {
    analytics.trackBusinessMetric(metric, value, properties);
  };

  const trackMilestone = (milestone: string, properties?: EventProperties) => {
    analytics.trackMilestone(milestone, properties);
  };

  const isFeatureFlagEnabled = (flagName: string): boolean => {
    return analytics.isFeatureFlagEnabled(flagName);
  };

  return {
    trackEvent,
    trackPageView,
    trackFeatureUsage,
    trackBusinessMetric,
    trackMilestone,
    isFeatureFlagEnabled,
  };
};

// Higher-order component for automatic page tracking
export const withAnalytics = <P extends object>(
  Component: React.ComponentType<P>,
  pageName: string
) => {
  return function AnalyticsWrappedComponent(props: P) {
    React.useEffect(() => {
      analytics.trackPageView(pageName);
    }, []);

    return React.createElement(Component, props);
  };
};

// Analytics Provider Component
export const AnalyticsProvider: React.FC<{
  children: React.ReactNode;
  userId?: string;
  userProperties?: Partial<UserProperties>;
}> = ({ children, userId, userProperties }) => {
  React.useEffect(() => {
    analytics.initialize(userId, userProperties);
  }, [userId, userProperties]);

  return React.createElement(
    React.Fragment,
    null,
    children,
    React.createElement(Analytics),
    React.createElement(SpeedInsights)
  );
};

// Utility functions for common tracking patterns
export const trackCRMAction = (
  action: keyof typeof ANALYTICS_EVENTS,
  properties?: EventProperties
) => {
  analytics.trackEvent(ANALYTICS_EVENTS[action], properties);
};

export const trackUserJourney = (
  step: string,
  properties?: EventProperties
) => {
  analytics.trackFunnelStep('user_onboarding', step, properties);
};

export const trackFeatureAdoption = (
  feature: string,
  adopted: boolean,
  properties?: EventProperties
) => {
  analytics.trackEvent('feature_adoption', {
    feature_name: feature,
    adopted,
    ...properties,
  });
};

export const trackBusinessGoal = (
  goal: string,
  achieved: boolean,
  value?: number,
  properties?: EventProperties
) => {
  analytics.trackEvent('business_goal', {
    goal_name: goal,
    achieved,
    goal_value: value,
    ...properties,
  });
};

export default analytics;
