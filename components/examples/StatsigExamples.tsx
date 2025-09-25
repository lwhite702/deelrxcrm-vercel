'use client';

import React from 'react';
import {
  useFeatureGate,
  useDynamicConfig,
  useExperiment,
  useStatsigClient,
} from '@statsig/react-bindings';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

// Example 1: Feature Gate for New CRM Features
export function NewCRMFeatures() {
  const { value: showAdvancedAnalytics } = useFeatureGate('advanced_analytics');
  const { value: showAIInsights } = useFeatureGate('ai_insights');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">CRM Features</h3>

      {/* Always show basic features */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Manage your customer database</p>
        </CardContent>
      </Card>

      {/* Conditionally show advanced features */}
      {showAdvancedAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>
              Advanced Analytics <Badge variant="secondary">NEW</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Deep insights into customer behavior and sales patterns</p>
          </CardContent>
        </Card>
      )}

      {showAIInsights && (
        <Card>
          <CardHeader>
            <CardTitle>
              AI-Powered Insights <Badge variant="secondary">BETA</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Get AI recommendations for customer engagement</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Example 2: Dynamic Config for UI Theming
export function ThemedDashboard() {
  const config = useDynamicConfig('dashboard_config');

  const primaryColor = config.get('primary_color', '#3b82f6');
  const maxItemsPerPage = config.get('items_per_page', 10);
  const showWelcomeMessage = config.get('show_welcome', true);

  return (
    <div className="p-6">
      {showWelcomeMessage && (
        <div
          className="p-4 rounded-lg mb-6 text-white"
          style={{ backgroundColor: primaryColor }}
        >
          Welcome to DeelRx CRM!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Show dynamic number of items */}
        {Array.from({ length: maxItemsPerPage }, (_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p>Dashboard Item {i + 1}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Example 3: A/B Test for Pricing Page
export function PricingExperiment() {
  const experiment = useExperiment('pricing_layout_test');

  const layout = experiment.groupName; // "control" or "new_layout"
  const showDiscount = experiment.get('discount_banner', false);
  const discountPercent = experiment.get('discount_amount', 10);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Choose Your Plan</h2>

      {showDiscount && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          🎉 Limited Time: {discountPercent}% off all plans!
        </div>
      )}

      <div
        className={`grid gap-6 ${
          layout === 'new_layout'
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-3'
        }`}
      >
        <Card>
          <CardHeader>
            <CardTitle>Basic</CardTitle>
            <CardDescription>$29/month</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Choose Basic</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Professional</CardTitle>
            <CardDescription>$79/month</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Choose Pro</Button>
          </CardContent>
        </Card>

        {layout === 'control' && (
          <Card>
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <CardDescription>$199/month</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Choose Enterprise</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Example 4: Custom Event Tracking
export function AnalyticsTrackingExample() {
  const statsigClient = useStatsigClient();

  const trackCustomerAction = (
    action: string,
    metadata?: Record<string, any>
  ) => {
    statsigClient.logEvent('customer_action', action, {
      page: 'crm_dashboard',
      ...metadata,
    });
  };

  const trackBusinessMetric = (metric: string, value: number) => {
    statsigClient.logEvent('business_metric', value, {
      metric_name: metric,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Analytics Tracking Examples</h3>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() =>
            trackCustomerAction('viewed_customer_profile', {
              customer_id: '123',
            })
          }
        >
          Track Profile View
        </Button>

        <Button
          variant="outline"
          onClick={() =>
            trackCustomerAction('initiated_payment', { amount: 150 })
          }
        >
          Track Payment Start
        </Button>

        <Button
          variant="outline"
          onClick={() => trackBusinessMetric('daily_revenue', 2500)}
        >
          Track Revenue
        </Button>

        <Button
          variant="outline"
          onClick={() => trackBusinessMetric('new_customers', 5)}
        >
          Track New Customers
        </Button>
      </div>
    </div>
  );
}

// Example 5: Complete CRM Dashboard with Statsig
export default function StatsigCRMDashboard() {
  const { value: showNewFeatures } = useFeatureGate('crm_v2_features');
  const config = useDynamicConfig('crm_dashboard_config');
  const experiment = useExperiment('dashboard_layout_test');
  const statsigClient = useStatsigClient();

  React.useEffect(() => {
    // Track dashboard load
    statsigClient.logEvent('dashboard_loaded');
  }, [statsigClient, showNewFeatures, experiment]);

  const dashboardTitle = config.get('dashboard_title', 'DeelRx CRM Dashboard');
  const showMetrics = config.get('show_metrics_widget', true);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">{dashboardTitle}</h1>

      {showMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">127</div>
              <div className="text-sm text-muted-foreground">
                Total Customers
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">$12,450</div>
              <div className="text-sm text-muted-foreground">
                Monthly Revenue
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">23</div>
              <div className="text-sm text-muted-foreground">
                Pending Orders
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">94%</div>
              <div className="text-sm text-muted-foreground">
                Customer Satisfaction
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <NewCRMFeatures />
      <ThemedDashboard />
      <PricingExperiment />
      <AnalyticsTrackingExample />
    </div>
  );
}
