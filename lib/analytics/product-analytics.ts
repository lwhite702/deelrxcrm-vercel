/**
 * Product Analytics Configuration
 * 
 * This module provides comprehensive product analytics tracking for DeelRx CRM, 
 * including user behavior analysis, feature usage tracking, and business metrics collection.
 * 
 * Analytics Providers Integrated:
 * 1. Vercel Analytics - Performance and Core Web Vitals
 * 2. PostHog - Product analytics and user behavior  
 * 3. Custom Events - Business-specific metrics
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

import { PostHog } from 'posthog-js';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Analytics configuration
const ANALYTICS_CONFIG = {
  posthog: {
    apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
    apiHost: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    options: {
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
      autocapture: true,
      disable_session_recording: false,
      enable_recording_console_log: false,
      session_recording: {
        maskAllInputs: true,
        maskInputOptions: {
          password: true,
          email: false,
        },
      },
    },
  },
  vercel: {
    debug: process.env.NODE_ENV === 'development',
  },
};

// Analytics Events for Business Intelligence
export const ANALYTICS_EVENTS = {
  // User Lifecycle
  USER_SIGNED_UP: 'user_signed_up',
  USER_COMPLETED_ONBOARDING: 'user_completed_onboarding',
  USER_INVITED_TEAM_MEMBER: 'user_invited_team_member',
  
  // Core CRM Actions
  CONTACT_CREATED: 'contact_created',
  CONTACT_IMPORTED: 'contact_imported',
  DEAL_CREATED: 'deal_created',
  DEAL_STAGE_CHANGED: 'deal_stage_changed',
  DEAL_WON: 'deal_won',
  DEAL_LOST: 'deal_lost',
  TASK_CREATED: 'task_created',
  TASK_COMPLETED: 'task_completed',
  
  // Feature Usage
  DASHBOARD_VIEWED: 'dashboard_viewed',
  REPORT_GENERATED: 'report_generated',
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  EXPORT_DATA: 'export_data',
  
  // Integration Usage
  EMAIL_INTEGRATION_CONNECTED: 'email_integration_connected',
  CALENDAR_SYNC_ENABLED: 'calendar_sync_enabled',
  API_KEY_CREATED: 'api_key_created',
  WEBHOOK_CONFIGURED: 'webhook_configured',
  
  // Business Metrics
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  PAYMENT_COMPLETED: 'payment_completed',
  TRIAL_STARTED: 'trial_started',
  TRIAL_CONVERTED: 'trial_converted',
  
  // User Experience
  FEATURE_FEEDBACK_SUBMITTED: 'feature_feedback_submitted',
  HELP_ARTICLE_VIEWED: 'help_article_viewed',
  SUPPORT_TICKET_CREATED: 'support_ticket_created',
} as const;

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
  private posthog: PostHog | null = null;
  private initialized = false;
  private eventQueue: Array<{ event: string; properties?: EventProperties }> = [];

  // Initialize analytics providers
  async initialize(userId?: string, userProperties?: Partial<UserProperties>) {
    if (this.initialized) return;

    try {
      // Initialize PostHog
      if (ANALYTICS_CONFIG.posthog.apiKey && typeof window !== 'undefined') {
        const { default: posthog } = await import('posthog-js');
        
        posthog.init(ANALYTICS_CONFIG.posthog.apiKey, {
          api_host: ANALYTICS_CONFIG.posthog.apiHost,
          ...ANALYTICS_CONFIG.posthog.options,
        });

        this.posthog = posthog;

        // Identify user if provided
        if (userId && userProperties) {
          this.identifyUser(userId, userProperties);
        }

        // Process queued events
        this.processEventQueue();
        
        this.initialized = true;

        console.log('✅ Product Analytics initialized');
      }
    } catch (error) {
      console.error('❌ Failed to initialize analytics:', error);
    }
  }

  // Identify user for personalized tracking
  identifyUser(userId: string, properties: Partial<UserProperties>) {
    if (!this.posthog) {
      console.warn('Analytics not initialized');
      return;
    }

    this.posthog.identify(userId, {
      ...properties,
      $set_once: {
        signup_date: properties.signup_date || new Date().toISOString(),
      },
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
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        referrer: typeof window !== 'undefined' ? document.referrer : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    };

    if (!this.initialized || !this.posthog) {
      // Queue events until analytics is initialized
      this.eventQueue.push(eventData);
      return;
    }

    try {
      this.posthog.capture(event, eventData.properties);
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
  trackFeatureUsage(feature: string, action: string, properties?: EventProperties) {
    this.trackEvent('feature_used', {
      feature_name: feature,
      action,
      ...properties,
    });
  }

  // Track business metrics for revenue intelligence
  trackBusinessMetric(metric: string, value: number, properties?: EventProperties) {
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
  trackPerformanceMetric(metric: string, value: number, context?: EventProperties) {
    this.trackEvent('performance_metric', {
      metric_name: metric,
      metric_value: value,
      performance_context: context,
    });
  }

  // Update user properties for progressive profiling
  updateUserProperties(properties: Partial<UserProperties>) {
    if (!this.posthog) {
      console.warn('Analytics not initialized');
      return;
    }

    this.posthog.setPersonProperties(properties);
  }

  // Track A/B test participation
  trackExperiment(experimentName: string, variant: string, properties?: EventProperties) {
    this.trackEvent('experiment_viewed', {
      experiment_name: experimentName,
      variant,
      ...properties,
    });

    // Set as user property for consistent experience
    if (this.posthog) {
      this.posthog.setPersonProperties({
        [`experiment_${experimentName}`]: variant,
      });
    }
  }

  // Track conversion funnel steps
  trackFunnelStep(funnelName: string, step: string, properties?: EventProperties) {
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
    if (this.posthog) {
      this.posthog.reset();
    }
  }

  // Get feature flags for A/B testing
  getFeatureFlag(flagName: string): boolean | string | undefined {
    if (!this.posthog) return undefined;
    return this.posthog.getFeatureFlag(flagName);
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

  const trackFeatureUsage = (feature: string, action: string, properties?: EventProperties) => {
    analytics.trackFeatureUsage(feature, action, properties);
  };

  const trackBusinessMetric = (metric: string, value: number, properties?: EventProperties) => {
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
    React.createElement(Analytics, ANALYTICS_CONFIG.vercel),
    React.createElement(SpeedInsights)
  );
};

// Utility functions for common tracking patterns
export const trackCRMAction = (action: keyof typeof ANALYTICS_EVENTS, properties?: EventProperties) => {
  analytics.trackEvent(ANALYTICS_EVENTS[action], properties);
};

export const trackUserJourney = (step: string, properties?: EventProperties) => {
  analytics.trackFunnelStep('user_onboarding', step, properties);
};

export const trackFeatureAdoption = (feature: string, adopted: boolean, properties?: EventProperties) => {
  analytics.trackEvent('feature_adoption', {
    feature_name: feature,
    adopted,
    ...properties,
  });
};

export const trackBusinessGoal = (goal: string, achieved: boolean, value?: number, properties?: EventProperties) => {
  analytics.trackEvent('business_goal', {
    goal_name: goal,
    achieved,
    goal_value: value,
    ...properties,
  });
};

export default analytics;