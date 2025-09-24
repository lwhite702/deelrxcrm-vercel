'use client';

import React from 'react';
import {
  useFeatureGate,
  useDynamicConfig,
  useStatsigClient,
} from '@statsig/react-bindings';

// Example: Enhanced Dashboard with Feature Gates
export function FeatureGatedDashboard() {
  const { value: aiEnabled } = useFeatureGate('ai_layer_enabled');
  const { value: advancedAnalytics } = useFeatureGate('advanced_analytics');
  const { value: realTimeDashboard } = useFeatureGate('real_time_dashboards');
  const { value: multiTenant } = useFeatureGate('multi_tenant_mode');

  const uiConfig = useDynamicConfig('ui_theme_config');
  const businessConfig = useDynamicConfig('business_rules_config');
  const statsigClient = useStatsigClient();

  const primaryColor = uiConfig.get('primary_color', '#3b82f6');
  const maxItemsPerPage = uiConfig.get('max_items_per_page', 25);
  const showWelcomeBanner = uiConfig.get('show_welcome_banner', true);

  React.useEffect(() => {
    // Log dashboard loaded event with simple string value
    statsigClient.logEvent('dashboard_loaded');

    // Log feature usage separately
    if (aiEnabled) statsigClient.logEvent('ai_enabled');
    if (advancedAnalytics) statsigClient.logEvent('advanced_analytics_enabled');
    if (realTimeDashboard)
      statsigClient.logEvent('real_time_dashboard_enabled');
  }, [statsigClient, aiEnabled, advancedAnalytics, realTimeDashboard]);

  return (
    <div className="p-6 space-y-6">
      {showWelcomeBanner && (
        <div
          className="p-4 rounded-lg text-white"
          style={{ backgroundColor: primaryColor }}
        >
          Welcome to DeelRx CRM - Street-Smart Business Management
        </div>
      )}

      {/* Multi-tenant switcher */}
      {multiTenant && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Organization Switcher</h3>
          <select className="p-2 border rounded">
            <option>Main Business</option>
            <option>Secondary Location</option>
            <option>Partner Network</option>
          </select>
        </div>
      )}

      {/* AI-powered insights */}
      {aiEnabled && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">🤖 AI Insights</h3>
          <ul className="text-blue-700 space-y-1">
            <li>• Customer #127 likely to churn - recommend outreach</li>
            <li>• Inventory for Product X running low - reorder suggested</li>
            <li>• Peak sales time detected: 2-4 PM weekdays</li>
          </ul>
        </div>
      )}

      {/* Real-time vs static dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold">$12,450</div>
          <div className="text-sm text-gray-600">
            Monthly Revenue{' '}
            {realTimeDashboard && (
              <span className="text-green-500">● Live</span>
            )}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold">127</div>
          <div className="text-sm text-gray-600">Total Customers</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold">23</div>
          <div className="text-sm text-gray-600">Pending Orders</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold">94%</div>
          <div className="text-sm text-gray-600">Satisfaction</div>
        </div>
      </div>

      {/* Advanced analytics section */}
      {advancedAnalytics && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">📊 Advanced Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Customer Behavior</h4>
              <p className="text-sm text-gray-600">Peak activity: 2-4 PM</p>
              <p className="text-sm text-gray-600">Avg session: 12 minutes</p>
            </div>
            <div>
              <h4 className="font-medium">Sales Trends</h4>
              <p className="text-sm text-gray-600">
                Growth: +15% vs last month
              </p>
              <p className="text-sm text-gray-600">
                Top product: Premium Package
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-500">
        Showing up to {maxItemsPerPage} items per page
      </p>
    </div>
  );
}

// Example: Payments with Feature Gates
export function FeatureGatedPayments() {
  const { value: advancedPayments } = useFeatureGate('advanced_payments');
  const { value: multiCurrency } = useFeatureGate('multi_currency_support');
  const { value: paymentScheduling } = useFeatureGate('payment_scheduling');

  const businessConfig = useDynamicConfig('business_rules_config');
  const statsigClient = useStatsigClient();

  const maxPaymentAmount = businessConfig.get('max_payment_amount', 10000);
  const processingFee = businessConfig.get('processing_fee_percent', 2.9);

  const handlePaymentMethod = (method: string) => {
    statsigClient.logEvent(`payment_method_${method}`);
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Payment Processing</h2>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <p className="text-yellow-800">
          Processing fee: {processingFee}% • Max amount: $
          {maxPaymentAmount.toLocaleString()}
        </p>
      </div>

      {/* Standard payment methods */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold mb-4">Standard Payments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            className="p-4 border rounded-lg hover:bg-gray-50"
            onClick={() => handlePaymentMethod('credit_card')}
          >
            💳 Credit Card
          </button>
          <button
            className="p-4 border rounded-lg hover:bg-gray-50"
            onClick={() => handlePaymentMethod('bank_transfer')}
          >
            🏦 Bank Transfer
          </button>
        </div>
      </div>

      {/* Advanced payment methods */}
      {advancedPayments && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">
            Advanced Payments <span className="text-blue-600 text-sm">NEW</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              className="p-4 border rounded-lg hover:bg-gray-50"
              onClick={() => handlePaymentMethod('ach')}
            >
              🔄 ACH Transfer
            </button>
            <button
              className="p-4 border rounded-lg hover:bg-gray-50"
              onClick={() => handlePaymentMethod('wire')}
            >
              📡 Wire Transfer
            </button>
            <button
              className="p-4 border rounded-lg hover:bg-gray-50"
              onClick={() => handlePaymentMethod('bulk')}
            >
              📦 Bulk Payments
            </button>
          </div>
        </div>
      )}

      {/* Multi-currency support */}
      {multiCurrency && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">Currency Options</h3>
          <select className="p-2 border rounded">
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="CAD">CAD - Canadian Dollar</option>
          </select>
        </div>
      )}

      {/* Payment scheduling */}
      {paymentScheduling && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">Schedule Payments</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="radio" name="schedule" className="mr-2" />
              One-time payment
            </label>
            <label className="flex items-center">
              <input type="radio" name="schedule" className="mr-2" />
              Recurring monthly
            </label>
            <label className="flex items-center">
              <input type="radio" name="schedule" className="mr-2" />
              Scheduled for later
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// Example: CRM Features with Gates
export function FeatureGatedCRM() {
  const { value: loyaltyPrograms } = useFeatureGate('loyalty_programs');
  const { value: inventoryManagement } = useFeatureGate('inventory_management');
  const { value: bulkOperations } = useFeatureGate('bulk_operations');
  const { value: auditLogging } = useFeatureGate('audit_logging');

  const statsigClient = useStatsigClient();

  const trackFeatureUsage = (feature: string) => {
    statsigClient.logEvent(feature);
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">CRM Features</h2>

      {/* Always available - core CRM */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold mb-4">Core CRM</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border rounded-lg hover:bg-gray-50">
            👥 Customer Management
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50">
            📋 Order Tracking
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50">
            💰 Payment History
          </button>
        </div>
      </div>

      {/* Loyalty programs */}
      {loyaltyPrograms && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">
            🎁 Loyalty Programs{' '}
            <span className="text-green-600 text-sm">ACTIVE</span>
          </h3>
          <div className="space-y-2">
            <p>Customer #127: 2,450 points (Gold tier)</p>
            <p>Customer #89: 890 points (Silver tier)</p>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={() => trackFeatureUsage('loyalty_program_view')}
            >
              Manage Rewards
            </button>
          </div>
        </div>
      )}

      {/* Inventory management */}
      {inventoryManagement && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">📦 Inventory Management</h3>
          <div className="space-y-2">
            <p>🔴 Product A: 5 units (Low stock!)</p>
            <p>🟢 Product B: 47 units</p>
            <p>🟡 Product C: 12 units</p>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => trackFeatureUsage('inventory_management')}
            >
              Manage Inventory
            </button>
          </div>
        </div>
      )}

      {/* Bulk operations */}
      {bulkOperations && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">⚡ Bulk Operations</h3>
          <div className="flex gap-2">
            <button
              className="bg-purple-600 text-white px-4 py-2 rounded"
              onClick={() => trackFeatureUsage('bulk_update_customers')}
            >
              Bulk Update Customers
            </button>
            <button
              className="bg-purple-600 text-white px-4 py-2 rounded"
              onClick={() => trackFeatureUsage('bulk_process_orders')}
            >
              Bulk Process Orders
            </button>
          </div>
        </div>
      )}

      {/* Audit logging indicator */}
      {auditLogging && (
        <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
          <p className="text-sm text-gray-600">
            🔒 Enhanced audit logging is active - all actions are being recorded
          </p>
        </div>
      )}
    </div>
  );
}
