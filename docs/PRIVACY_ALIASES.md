# Privacy Aliases - SimpleLogin Integration

This document describes the SimpleLogin privacy alias integration in DeelRxCRM, providing users with optional email privacy during signup and account management.

## Overview

SimpleLogin is a privacy-focused email aliasing service that allows users to create email aliases that forward to their real email address. This integration provides:

- **Optional privacy aliases** during signup
- **Alias management** in user settings
- **Admin oversight** of all aliases
- **Automatic bounce handling** and health monitoring
- **Compliance-focused approach** with clear legal boundaries

## Architecture

### Core Components

#### 1. SimpleLogin API Integration (`lib/alias/simplelogin.ts`)
- `createAlias()` - Creates new aliases via SimpleLogin API
- `disableAlias()` - Deactivates aliases in SimpleLogin
- `validateForwarding()` - Checks alias delivery status
- `getAliasInfo()` - Retrieves alias metadata

#### 2. Database Schema (`lib/db/schema.ts`)
- `aliases` table - Tracks user aliases with delivery metrics
- `aliasEmailEvents` table - Stores email delivery events for aliases

#### 3. User Interface
- **Signup Flow** (`app/(login)/login.tsx`) - Optional alias generation
- **Account Settings** (`app/(dashboard)/settings/account/page.tsx`) - Alias management
- **Admin Dashboard** (`app/(dashboard)/admin/email/aliases/page.tsx`) - System-wide oversight

#### 4. Email Processing
- **Enhanced Sending** (`lib/email/send.ts`) - Alias detection and special handling
- **Webhook Processing** (`app/api/webhooks/resend/route.ts`) - Bounce tracking and auto-deactivation

#### 5. Background Monitoring (`lib/inngest/functions/alias.ts`)
- Daily health checks
- Automatic deactivation of problematic aliases
- User notifications for delivery issues

## Configuration

### Environment Variables

Add to `.env`:

```bash
# SimpleLogin API Configuration
SIMPLELOGIN_API_KEY=sl_...                                    # Required: Your SimpleLogin API key
SIMPLELOGIN_API_URL=https://api.simplelogin.io              # Optional: API base URL (defaults to official)
SIMPLELOGIN_ALIAS_DOMAIN=alias.yourdomain.com               # Optional: Custom domain for aliases

# Email Configuration (existing)
EMAIL_FROM="DeelRxCRM <no-reply@deelrxcrm.app>"             # Required: From address for emails
RESEND_API_KEY=re_...                                        # Required: Resend API key
```

### SimpleLogin Account Setup

1. **Create SimpleLogin Account**: Sign up at [SimpleLogin.io](https://simplelogin.io)
2. **Generate API Key**: Go to API Keys section in dashboard
3. **Configure Domain** (Optional): Set up custom domain for branded aliases
4. **Set Up Webhooks** (Optional): Configure delivery status webhooks

## User Experience

### Signup Flow

1. **Standard Email Input**: User enters email normally
2. **Privacy Option**: "Generate Private Alias" button appears in signup mode
3. **Alias Creation**: Clicking creates alias via SimpleLogin API
4. **Auto-Fill**: Generated alias automatically populates email field
5. **Legal Notice**: Clear disclaimer about privacy limitations
6. **Fallback**: User can still type normal email if preferred

### Account Management

Users can view and manage their aliases in Settings → Account:

- **View Current Aliases**: List with status and health metrics
- **Disable Aliases**: Deactivate unwanted aliases
- **Health Status**: Delivery status indicators (OK, Warning, Error)
- **Bounce Tracking**: Number of failed deliveries
- **Legal Reminders**: Clear expectations and responsibilities

### Admin Oversight

Administrators have full visibility:

- **Alias Directory**: All user aliases with search/filter
- **Health Monitoring**: Delivery status across all aliases
- **Bulk Actions**: Disable problematic aliases
- **Export Capability**: CSV export for compliance/analysis
- **User Context**: Link aliases to user accounts

## Technical Implementation

### Alias Detection

Email addresses are detected as aliases using:

```typescript
function isAliasEmail(email: string): boolean {
  const patterns = [
    /^[a-zA-Z0-9._-]+\.(alias|sl)@[a-zA-Z0-9.-]+$/i,
    /simplelogin\./i,
    /\.alias\./i,
  ];
  
  // Check custom domain
  const aliasDomain = process.env.SIMPLELOGIN_ALIAS_DOMAIN;
  if (aliasDomain && email.includes(aliasDomain)) {
    return true;
  }
  
  return patterns.some(pattern => pattern.test(email));
}
```

### Email Delivery Optimization

Emails to aliases receive special handling:

- **Header Tagging**: `X-DeelRxCRM-Alias: true` header added
- **Lightweight Content**: Optimized for alias forwarding
- **Delivery Tracking**: Enhanced monitoring for bounce detection
- **Auto-Recovery**: Failed aliases marked for review

### Health Monitoring

Daily background jobs:

1. **Delivery Testing**: Periodic validation of alias forwarding
2. **Bounce Processing**: Automatic counting and threshold enforcement
3. **Auto-Deactivation**: Aliases with 2+ bounces automatically disabled
4. **User Notifications**: In-app alerts for delivery issues

## Security & Privacy

### Data Protection

- **Minimal Storage**: Only essential alias metadata stored locally
- **No PII Exposure**: Admin views show aliases but protect user identity context appropriately
- **Audit Logging**: All alias operations logged for compliance
- **Secure API Calls**: All SimpleLogin communication over HTTPS with API key auth

### Privacy Boundaries

Clear limitations communicated to users:

- **No Anonymity Guarantee**: Aliases provide privacy, not anonymity
- **Third-Party Dependency**: Relies on SimpleLogin service availability
- **User Responsibility**: Users must maintain access to aliases
- **Legal Compliance**: Users responsible for lawful use

### Access Controls

- **User Scope**: Users can only manage their own aliases
- **Admin Oversight**: Superadmins can view/disable any alias for system maintenance
- **API Protection**: All endpoints require proper authentication
- **Rate Limiting**: API calls to SimpleLogin are rate-limited

## Failure Modes & Recovery

### SimpleLogin API Failures

- **Graceful Degradation**: Signup continues with user's regular email if alias creation fails
- **Error Messaging**: Clear user feedback when alias generation is unavailable
- **Retry Logic**: Automatic retries with exponential backoff
- **Fallback Options**: Users can always use regular email addresses

### Delivery Issues

- **Bounce Detection**: Webhook processing tracks delivery failures
- **Progressive Warnings**: Single bounce = warning, 2+ bounces = auto-disable
- **User Notification**: In-app alerts (never email to broken alias about itself)
- **Manual Recovery**: Admin tools to re-enable aliases after issues resolved

### Database Consistency

- **Orphaned Records**: Background cleanup of aliases for deleted users
- **Sync Issues**: Periodic reconciliation with SimpleLogin API status
- **Migration Safety**: Schema changes maintain backward compatibility

## Compliance & Legal

### User Agreement Elements

Include in Terms of Service:

- Alias service is optional and experimental
- No guarantee of delivery or privacy
- User responsible for maintaining alias access
- DeelRxCRM may disable aliases for system stability
- Legal use requirement

### Data Processing

- **Purpose Limitation**: Aliases used only for email delivery
- **Retention Policy**: Inactive aliases archived after 1 year
- **User Rights**: Users can request alias deletion
- **Third-Party Disclosure**: SimpleLogin processing clearly disclosed

## Monitoring & Metrics

Key metrics to track:

- **Adoption Rate**: % of signups using aliases
- **Health Status**: Alias delivery success rates
- **Support Impact**: Support tickets related to alias issues
- **System Load**: API call volume to SimpleLogin
- **User Satisfaction**: Feedback on alias functionality

## Development & Testing

### Local Development

1. **Mock Mode**: Set up test alias generation without API calls
2. **Database Migration**: Run alias table migrations
3. **Email Simulation**: Test bounce handling with simulated events
4. **UI Testing**: Verify signup flow and settings pages

### Production Deployment

1. **Environment Setup**: Configure SimpleLogin API keys
2. **Database Migration**: Deploy alias schema changes
3. **Webhook Configuration**: Set up Resend bounce processing
4. **Monitoring Setup**: Enable health check background jobs
5. **Feature Toggle**: Gradual rollout capability

## Support & Troubleshooting

### Common Issues

1. **Alias Creation Fails**: Check API key and SimpleLogin service status
2. **Emails Not Delivered**: Verify alias is active and SimpleLogin forwarding is working
3. **Bounces**: Check user's actual email address and inbox capacity
4. **Admin Access**: Ensure proper role permissions for alias management

### Debug Tools

- **Health Check Endpoint**: Manual alias validation
- **Event Logs**: Detailed webhook processing logs
- **Admin Dashboard**: Real-time alias status monitoring
- **API Testing**: Direct SimpleLogin API connectivity tests

## Future Enhancements

Potential improvements:

- **Multiple Aliases**: Allow users to create multiple aliases
- **Alias Rotation**: Automatic periodic alias regeneration
- **Custom Domains**: White-label alias domains
- **Advanced Analytics**: Detailed delivery and engagement metrics
- **Integration Testing**: Automated end-to-end alias workflow tests