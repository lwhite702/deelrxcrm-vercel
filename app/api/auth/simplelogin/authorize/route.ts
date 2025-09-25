import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

/**
 * SimpleLogin OAuth2 Authorization Initiation
 * 
 * Redirects users to SimpleLogin for OAuth2 authorization.
 * Generates and stores state parameter for CSRF protection.
 */

const SIMPLELOGIN_AUTH_URL = 'https://app.simplelogin.io/oauth2/authorize';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('returnTo') || '/dashboard';

    // Generate state parameter for CSRF protection
    const state = randomBytes(32).toString('hex');

    // Store state in cookie for verification
    const cookieStore = await cookies();
    cookieStore.set('simplelogin_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    // Store return URL for post-auth redirect
    cookieStore.set('simplelogin_return_to', returnTo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    // Build authorization URL
    const authUrl = new URL(SIMPLELOGIN_AUTH_URL);
    authUrl.searchParams.set('client_id', process.env.SIMPLELOGIN_OAUTH_CLIENT_ID!);
    authUrl.searchParams.set('redirect_uri', process.env.SIMPLELOGIN_OAUTH_REDIRECT_URI!);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('state', state);

    return NextResponse.redirect(authUrl.toString());

  } catch (error) {
    console.error('SimpleLogin OAuth initiation error:', error);
    return NextResponse.redirect(
      new URL('/login?error=oauth_init_failed', request.url)
    );
  }
}