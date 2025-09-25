middleware.ts (guard admin UI & admin APIs)# SimpleLogin OAuth2 Integration

This document describes the SimpleLogin OAuth2 integration for enhanced user authentication and privacy alias management.

## Overview

The SimpleLogin OAuth2 integration allows users to:
- Sign in/up using their SimpleLogin account
- Automatically link their SimpleLogin aliases to their DeelRxCRM account
- Enhanced privacy and security through SimpleLogin's OAuth2 flow

## Configuration

### 1. SimpleLogin App Registration

Register your application at [SimpleLogin Developer Console](https://app.simplelogin.io/developer):

1. Go to https://app.simplelogin.io/developer
2. Create a new OAuth2 application
3. Note down your App ID and App Secret
4. Set redirect URLs:
   - Development: `http://localhost:3000/api/auth/simplelogin/callback`
   - Production: `https://deelrxcrm.app/api/auth/simplelogin/callback`

### 2. Environment Variables

Add these variables to your `.env` files:

```bash
# SimpleLogin OAuth2 Configuration
SIMPLELOGIN_OAUTH_CLIENT_ID=your-app-id
SIMPLELOGIN_OAUTH_CLIENT_SECRET=your-app-secret
SIMPLELOGIN_OAUTH_REDIRECT_URI=https://deelrxcrm.app/api/auth/simplelogin/callback
NEXT_PUBLIC_SIMPLELOGIN_OAUTH_ENABLED=true
```

**Important**: Set `NEXT_PUBLIC_SIMPLELOGIN_OAUTH_ENABLED=true` to show the OAuth login button.

## OAuth2 Flow

### 1. Authorization Request

When users click "Sign in with SimpleLogin":
- Redirects to `/api/auth/simplelogin/authorize`
- Generates CSRF state parameter
- Redirects to SimpleLogin authorization endpoint

### 2. Authorization Callback

After user authorization:
- SimpleLogin redirects to `/api/auth/simplelogin/callback`
- Verifies state parameter (CSRF protection)
- Exchanges authorization code for access token
- Fetches user information from SimpleLogin
- Creates or updates user account in DeelRxCRM
- Sets user session

### 3. User Experience

- Seamless login/signup with SimpleLogin account
- No password required for OAuth users
- Enhanced privacy through SimpleLogin's infrastructure
- Optional alias management integration

## API Endpoints

### GET /api/auth/simplelogin/authorize

Initiates OAuth2 authorization flow.

**Query Parameters:**
- `returnTo` (optional): URL to redirect after successful auth

**Response**: Redirects to SimpleLogin authorization endpoint

### GET /api/auth/simplelogin/callback

Handles OAuth2 callback from SimpleLogin.

**Query Parameters:**
- `code`: Authorization code from SimpleLogin
- `state`: CSRF protection state parameter
- `error` (optional): Error code if authorization failed

**Response**: Redirects to dashboard or login with error

## Security Features

### CSRF Protection
- Generates random state parameter
- Stores in secure HTTP-only cookie
- Verifies on callback

### Secure Token Handling
- Access tokens stored in HTTP-only cookies
- Short expiration times
- Automatic cleanup on errors

### User Data Protection
- Minimal user data storage
- Links to existing user accounts when possible
- Respects SimpleLogin's privacy principles

## Error Handling

Common error scenarios:

1. **OAuth Error**: User denies authorization
   - Redirects to login with `error=oauth_error`

2. **State Mismatch**: CSRF protection triggered
   - Redirects to login with `error=state_mismatch`

3. **Token Exchange Failed**: Issues with SimpleLogin API
   - Redirects to login with `error=token_exchange_failed`

4. **Database Error**: Issues creating/updating user
   - Redirects to login with `error=database_error`

## Integration with Alias System

When combined with the existing SimpleLogin alias integration:

1. **Enhanced User Experience**: Users can manage both authentication and aliases through SimpleLogin
2. **Automatic Linking**: OAuth users can have their aliases automatically detected
3. **Unified Privacy**: Single privacy-focused authentication and email system

## Development Testing

For local development:

1. Set up a SimpleLogin developer account
2. Create a test OAuth2 application
3. Use `http://localhost:3000/api/auth/simplelogin/callback` as redirect URI
4. Set `NEXT_PUBLIC_SIMPLELOGIN_OAUTH_ENABLED=true` in `.env.local`
5. Test the complete OAuth flow

## Production Deployment

1. Update redirect URI to production domain
2. Set environment variables in production
3. Test OAuth flow in production environment
4. Monitor error logs for OAuth-related issues

## Compatibility

- Works alongside existing email/password authentication
- Compatible with existing SimpleLogin alias integration
- Does not interfere with other authentication methods
- Gracefully degrades when OAuth is not configured