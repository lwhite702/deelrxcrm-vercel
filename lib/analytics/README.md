# PostHog Analytics Integration

This directory contains the complete PostHog analytics integration for the DeelRx CRM application, implemented as part of Phase 6 analytics infrastructure.

## 📁 File Structure

```
lib/analytics/
├── posthog-config.ts      # PostHog configuration and event definitions
├── posthog-provider.tsx   # React provider and client-side hooks
├── product-analytics.ts   # Main analytics class (updated for PostHog)
├── index.tsx             # Combined analytics provider
└── test-integration.ts   # Integration tests
```

## 🚀 Quick Start

### 1. Environment Variables

Add these environment variables to your `.env.local`:

```bash
# PostHog Configuration
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
POSTHOG_PERSONAL_API_KEY=your_personal_api_key
```

### 2. Wrap Your App

```tsx
// app/layout.tsx
import { CombinedAnalyticsProvider } from '@/lib/analytics';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CombinedAnalyticsProvider>
          {children}
        </CombinedAnalyticsProvider>
      </body>
    </html>
  );
}
```

### 3. Track Events

```tsx
// In your components
import { trackEvent, POSTHOG_EVENTS } from '@/lib/analytics';

export function SignUpButton() {
  const handleSignUp = () => {
    // Track the signup event
    trackEvent(POSTHOG_EVENTS.USER_SIGNED_UP, {
      signup_method: 'email',
      utm_source: 'homepage',
    });
  };

  return <button onClick={handleSignUp}>Sign Up</button>;
}
```

## 📊 Available Events

The system includes 47 predefined events across different categories:

### Authentication
- `USER_SIGNED_UP` - User registration
- `USER_SIGNED_IN` - User login
- `USER_SIGNED_OUT` - User logout

### CRM Operations
- `CUSTOMER_CREATED` - New customer added
- `CUSTOMER_UPDATED` - Customer information modified
- `CUSTOMER_VIEWED` - Customer profile accessed
- `TASK_CREATED` - New task created
- `TASK_COMPLETED` - Task marked as complete

### Business Metrics
- `PAYMENT_PROCESSED` - Payment transaction
- `SUBSCRIPTION_CREATED` - New subscription
- `INVOICE_CREATED` - Invoice generated
- `INVOICE_PAID` - Invoice payment received

### AI Features
- `AI_PRICING_GENERATED` - AI-powered pricing suggestion
- `AI_DATA_ENRICHED` - Data enhancement via AI
- `AI_CREDIT_USED` - AI credit consumption

### System Performance
- `PAGE_LOAD_TIME` - Page loading performance
- `API_RESPONSE_TIME` - API call performance
- `ERROR_OCCURRED` - Error tracking

## 🔧 API Reference

### Tracking Functions

```tsx
import { 
  trackEvent, 
  identifyUser, 
  setUserProperties,
  trackPageView,
  getFeatureFlag 
} from '@/lib/analytics';

// Track custom events
trackEvent('Custom Event', { property: 'value' });

// Identify users
identifyUser('user-123', {
  email: 'user@example.com',
  name: 'John Doe',
  subscription_plan: 'pro'
});

// Set user properties
setUserProperties({
  total_customers: 50,
  monthly_revenue: 5000
});

// Track page views
trackPageView('Dashboard', { section: 'main' });

// Get feature flags
const showNewFeature = getFeatureFlag('new-feature-flag');
```

### PostHog Hook

```tsx
import { usePostHog } from '@/lib/analytics';

function MyComponent() {
  const posthog = usePostHog();
  
  const handleClick = () => {
    posthog?.capture('button_clicked', {
      button_name: 'cta',
      location: 'header'
    });
  };
  
  return <button onClick={handleClick}>Click Me</button>;
}
```

## 🏗️ Architecture

### Server-Side Analytics
- Uses `posthog-node` for server-side event tracking
- Configured in `posthog-config.ts` with `getServerPostHog()`
- Suitable for API routes and server components

### Client-Side Analytics  
- Uses `posthog-js` for browser-based tracking
- Automatic pageview tracking
- Session recording capabilities
- Feature flag support

### Privacy & Compliance
- Respects Do Not Track headers
- Secure cookie handling
- GDPR-compliant user identification
- Optional session recording masking

## 🧪 Testing

Run the integration test to verify setup:

```tsx
import { testPostHogIntegration } from '@/lib/analytics/test-integration';

// Test in your browser console or component
testPostHogIntegration();
```

## 📈 Analytics Dashboard

Access your PostHog dashboard at https://app.posthog.com to view:

- Real-time event streams
- User behavior funnels  
- Cohort analysis
- Feature flag management
- Session recordings
- Custom dashboards

## 🔍 Debugging

### Check Configuration
```tsx
import { isPostHogConfigured } from '@/lib/analytics';

console.log('PostHog configured:', isPostHogConfigured());
```

### View Events in Console
Enable debug mode in development:
```tsx
// In posthog-config.ts
export const posthogConfig = {
  options: {
    debug: process.env.NODE_ENV === 'development',
    // ... other options
  }
};
```

## 🔧 Advanced Configuration

### Custom Event Properties
Define custom properties for events:

```tsx
trackEvent(POSTHOG_EVENTS.CUSTOMER_CREATED, {
  customer_type: 'enterprise',
  acquisition_channel: 'sales_call',
  initial_contract_value: 50000,
  assigned_rep: 'john.doe@company.com'
});
```

### Feature Flags Integration
```tsx
import { isFeatureFlagEnabled } from '@/lib/analytics';

export function NewFeature() {
  const showFeature = isFeatureFlagEnabled('new-ui-design');
  
  if (!showFeature) return null;
  
  return <div>New UI Design</div>;
}
```

## 📚 Resources

- [PostHog Documentation](https://posthog.com/docs)
- [PostHog JavaScript SDK](https://posthog.com/docs/libraries/js)
- [PostHog Node.js SDK](https://posthog.com/docs/libraries/node)
- [Feature Flags Guide](https://posthog.com/docs/user-guides/feature-flags)

## 🚨 Important Notes

1. **Environment Variables**: Ensure all PostHog environment variables are set
2. **API Keys**: Keep personal API keys secure and never commit them
3. **Performance**: PostHog batches events to minimize performance impact
4. **Privacy**: Review and configure data capture according to your privacy policy
5. **Testing**: Use test mode in development to avoid polluting production analytics

## 📝 Migration Notes

This integration updates the existing `product-analytics.ts` system to use PostHog as the underlying analytics provider while maintaining the same API surface for backward compatibility.