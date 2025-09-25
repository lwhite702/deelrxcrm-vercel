import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from './lib/auth/session';
import { applySecurityHeaders } from './lib/security';
import { AuthError, requireRole } from './lib/auth/jwt';

const PROTECTED_PREFIX = '/dashboard';
const SUPERADMIN_DASHBOARD_PREFIX = '/dashboard/admin/email';
const SUPERADMIN_API_PREFIX = '/api/admin/email';

// Block dev-only routes in production
const DEV_ONLY_ROUTES = [
  '/email-previews',
  '/api/_health/error-test',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = pathname.startsWith(PROTECTED_PREFIX);
  const isSuperAdminDashboard = pathname.startsWith(SUPERADMIN_DASHBOARD_PREFIX);
  const isSuperAdminApi = pathname.startsWith(SUPERADMIN_API_PREFIX);
  
  // Block dev-only routes in production
  if (process.env.NODE_ENV === 'production') {
    const isDevRoute = DEV_ONLY_ROUTES.some(route => pathname.startsWith(route));
    if (isDevRoute) {
      return new NextResponse('Not Found', { status: 404 });
    }
  }

  if (isSuperAdminDashboard || isSuperAdminApi) {
    try {
      await requireRole(request, 'superAdmin');
    } catch (error) {
      if (error instanceof AuthError) {
        if (isSuperAdminDashboard) {
          const redirectTarget = error.status === 401 ? '/sign-in' : '/dashboard';
          return NextResponse.redirect(new URL(redirectTarget, request.url));
        }

        return new NextResponse(error.message, { status: error.status });
      }

      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const response = NextResponse.next();

  try {
    applySecurityHeaders(response);
  } catch (error) {
    console.error('Failed to apply security headers:', error);
  }

  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

      response.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString(),
        }),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresInOneDay,
      });
    } catch (error) {
      console.error('Error updating session:', error);
      response.cookies.delete('session');
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/admin/email/:path*',
    // Exclude static files, API routes (handled separately), and public assets
    '/((?!api|_next/static|_next/image|favicon.ico|mintlify|webhooks|_health|public).*)',
  ],
  runtime: 'nodejs',
};
