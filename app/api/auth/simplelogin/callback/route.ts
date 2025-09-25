import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { setSession } from '@/lib/auth/session';

/**
 * SimpleLogin OAuth2 Callback Handler
 * 
 * Handles the OAuth2 callback from SimpleLogin after user authorization.
 * This creates or updates user accounts and optionally links SimpleLogin aliases.
 */

const SIMPLELOGIN_TOKEN_URL = 'https://app.simplelogin.io/oauth2/token';
const SIMPLELOGIN_USERINFO_URL = 'https://app.simplelogin.io/oauth2/userinfo';

interface SimpleLoginTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface SimpleLoginUserInfo {
  sub: string; // User ID
  email: string;
  name?: string;
  avatar_url?: string;
  premium?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('SimpleLogin OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/login?error=oauth_error&message=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/login?error=missing_code', request.url)
      );
    }

    // Verify state parameter (CSRF protection)
    const cookieStore = await cookies();
    const storedState = cookieStore.get('simplelogin_oauth_state')?.value;
    
    if (!storedState || storedState !== state) {
      console.error('State mismatch in SimpleLogin OAuth');
      return NextResponse.redirect(
        new URL('/login?error=state_mismatch', request.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(SIMPLELOGIN_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.SIMPLELOGIN_OAUTH_CLIENT_ID!,
        client_secret: process.env.SIMPLELOGIN_OAUTH_CLIENT_SECRET!,
        code,
        redirect_uri: process.env.SIMPLELOGIN_OAUTH_REDIRECT_URI!,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to exchange code for token:', errorText);
      return NextResponse.redirect(
        new URL('/login?error=token_exchange_failed', request.url)
      );
    }

    const tokenData: SimpleLoginTokenResponse = await tokenResponse.json();

    // Get user info from SimpleLogin
    const userInfoResponse = await fetch(SIMPLELOGIN_USERINFO_URL, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json',
      },
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info from SimpleLogin');
      return NextResponse.redirect(
        new URL('/login?error=userinfo_failed', request.url)
      );
    }

    const userInfo: SimpleLoginUserInfo = await userInfoResponse.json();

    // Create or update user in database
    
    let user;
    try {
      // Check if user already exists
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, userInfo.email))
        .limit(1);

      if (existingUsers.length > 0) {
        // Update existing user
        user = existingUsers[0];
        await db
          .update(users)
          .set({
            name: userInfo.name || user.name,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
      } else {
        // Create new user
        const newUsers = await db
          .insert(users)
          .values({
            email: userInfo.email,
            name: userInfo.name || userInfo.email.split('@')[0],
            passwordHash: '', // OAuth users don't need password hash
            role: 'member',
          })
          .returning();
        
        user = newUsers[0];
      }

      // Set user session using existing auth system
      await setSession(user);

      // Create response with redirect
      const response = NextResponse.redirect(
        new URL('/dashboard?welcome=simplelogin', request.url)
      );

      // Clean up OAuth state cookie
      response.cookies.delete('simplelogin_oauth_state');

      // Store SimpleLogin access token for potential alias management
      if (tokenData.access_token) {
        response.cookies.set('simplelogin_token', tokenData.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: tokenData.expires_in,
          path: '/',
        });
      }

      return response;

    } catch (dbError) {
      console.error('Database error during SimpleLogin OAuth:', dbError);
      return NextResponse.redirect(
        new URL('/login?error=database_error', request.url)
      );
    }

  } catch (error) {
    console.error('SimpleLogin OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/login?error=callback_error', request.url)
    );
  }
}