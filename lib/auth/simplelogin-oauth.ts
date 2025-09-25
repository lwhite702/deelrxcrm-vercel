/**
 * SimpleLogin OAuth2 Integration Utilities
 * 
 * Helper functions for SimpleLogin OAuth2 flow integration.
 * This enhances the existing SimpleLogin API integration with OAuth capabilities.
 */

interface SimpleLoginOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string;
}

export class SimpleLoginOAuth {
  private config: SimpleLoginOAuthConfig;

  constructor(config: SimpleLoginOAuthConfig) {
    this.config = {
      scope: 'openid profile email',
      ...config,
    };
  }

  /**
   * Generate authorization URL for SimpleLogin OAuth2 flow
   */
  getAuthorizationUrl(state: string, returnTo?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope!,
      state,
    });

    return `https://app.simplelogin.io/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
  }> {
    const response = await fetch('https://app.simplelogin.io/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get user information using access token
   */
  async getUserInfo(accessToken: string): Promise<{
    sub: string;
    email: string;
    name?: string;
    avatar_url?: string;
    premium?: boolean;
  }> {
    const response = await fetch('https://app.simplelogin.io/oauth2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return response.json();
  }

  /**
   * Revoke an access token
   */
  async revokeToken(token: string): Promise<void> {
    const response = await fetch('https://app.simplelogin.io/oauth2/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        token,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to revoke token');
    }
  }
}

/**
 * Create configured SimpleLogin OAuth instance
 */
export function createSimpleLoginOAuth(): SimpleLoginOAuth {
  const config = {
    clientId: process.env.SIMPLELOGIN_OAUTH_CLIENT_ID!,
    clientSecret: process.env.SIMPLELOGIN_OAUTH_CLIENT_SECRET!,
    redirectUri: process.env.SIMPLELOGIN_OAUTH_REDIRECT_URI!,
  };

  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    throw new Error('SimpleLogin OAuth configuration missing. Please set SIMPLELOGIN_OAUTH_* environment variables.');
  }

  return new SimpleLoginOAuth(config);
}

/**
 * Check if SimpleLogin OAuth is properly configured
 */
export function isSimpleLoginOAuthEnabled(): boolean {
  return !!(
    process.env.SIMPLELOGIN_OAUTH_CLIENT_ID &&
    process.env.SIMPLELOGIN_OAUTH_CLIENT_SECRET &&
    process.env.SIMPLELOGIN_OAUTH_REDIRECT_URI
  );
}