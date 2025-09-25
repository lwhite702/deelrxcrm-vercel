/**
 * PostHog Analytics Configuration
 *
 * This file configures PostHog for both client-side and server-side analytics
 * as part of the Phase 6 Product Analytics System.
 */

// Server-side PostHog configuration moved to posthog-server.ts

/**
 * Client-side PostHog configuration
 */
export const posthogConfig = {
  key: process.env.NEXT_PUBLIC_POSTHOG_KEY!,
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  options: {
    // Capture pageviews automatically
    capture_pageview: true,
    // Capture clicks automatically
    capture_pageleave: true,
    // Enable session recordings
    disable_session_recording: false,
    // Enable autocapture
    autocapture: true,
    // Capture performance events
    capture_performance: true,
    // Respect user privacy
    respect_dnt: true,
    // Load flags on initialization
    bootstrap: {
      featureFlags: {},
    },
    // Debugging in development
    debug: process.env.NODE_ENV === 'development',
    // Persistence configuration
    persistence: 'localStorage+cookie',
    // Cookie configuration
    cookie_name: 'ph_deelrx_session',
    cross_subdomain_cookie: false,
    secure_cookie: process.env.NODE_ENV === 'production',
    // IP anonymization
    ip: false,
    // Disable default properties we handle ourselves
    disable_external_dependency_loading: false,
  },
};

/**
 * Check if PostHog is properly configured
 */
export function isPostHogConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST
  );
}

/**
 * Event names for consistent tracking
 * These align with the 47 events defined in product-analytics.ts
 */
export const POSTHOG_EVENTS = {
  // Authentication
  USER_SIGNED_UP: 'User Signed Up',
  USER_SIGNED_IN: 'User Signed In',
  USER_SIGNED_OUT: 'User Signed Out',

  // Dashboard
  DASHBOARD_VIEWED: 'Dashboard Viewed',
  DASHBOARD_WIDGET_CLICKED: 'Dashboard Widget Clicked',

  // CRM
  CUSTOMER_CREATED: 'Customer Created',
  CUSTOMER_UPDATED: 'Customer Updated',
  CUSTOMER_DELETED: 'Customer Deleted',
  CUSTOMER_VIEWED: 'Customer Viewed',

  // Tasks
  TASK_CREATED: 'Task Created',
  TASK_COMPLETED: 'Task Completed',
  TASK_UPDATED: 'Task Updated',
  TASK_DELETED: 'Task Deleted',

  // Communications
  EMAIL_SENT: 'Email Sent',
  EMAIL_OPENED: 'Email Opened',
  EMAIL_CLICKED: 'Email Clicked',
  SMS_SENT: 'SMS Sent',

  // Payments
  INVOICE_CREATED: 'Invoice Created',
  INVOICE_PAID: 'Invoice Paid',
  PAYMENT_PROCESSED: 'Payment Processed',
  SUBSCRIPTION_CREATED: 'Subscription Created',
  SUBSCRIPTION_CANCELLED: 'Subscription Cancelled',

  // AI Features
  AI_PRICING_GENERATED: 'AI Pricing Generated',
  AI_DATA_ENRICHED: 'AI Data Enriched',
  AI_TRAINING_COMPLETED: 'AI Training Completed',
  AI_CREDIT_USED: 'AI Credit Used',

  // Analytics
  REPORT_GENERATED: 'Report Generated',
  EXPORT_DOWNLOADED: 'Export Downloaded',
  FILTER_APPLIED: 'Filter Applied',

  // Settings
  SETTINGS_UPDATED: 'Settings Updated',
  INTEGRATION_CONFIGURED: 'Integration Configured',
  TEAM_MEMBER_ADDED: 'Team Member Added',

  // Feature Usage
  FEATURE_VIEWED: 'Feature Viewed',
  FEATURE_CLICKED: 'Feature Clicked',
  HELP_ACCESSED: 'Help Accessed',

  // Errors
  ERROR_OCCURRED: 'Error Occurred',
  PAGE_NOT_FOUND: 'Page Not Found',

  // Performance
  PAGE_LOAD_TIME: 'Page Load Time',
  API_RESPONSE_TIME: 'API Response Time',
} as const;

/**
 * User properties for consistent identification
 */
export const POSTHOG_USER_PROPERTIES = {
  EMAIL: 'email',
  NAME: 'name',
  ROLE: 'role',
  TEAM_ID: 'team_id',
  SUBSCRIPTION_PLAN: 'subscription_plan',
  CREATED_AT: 'created_at',
  LAST_ACTIVE: 'last_active',
  TOTAL_CUSTOMERS: 'total_customers',
  TOTAL_REVENUE: 'total_revenue',
  FEATURE_FLAGS: 'feature_flags',
} as const;

export default posthogConfig;
