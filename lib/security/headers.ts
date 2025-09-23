import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

export function securityHeaders(req: NextRequest, res: NextResponse) {
  const nonce = nanoid();
  
  // Strict Content Security Policy
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`, // unsafe-eval needed for Next.js dev
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`, // unsafe-inline needed for CSS-in-JS
    "connect-src 'self' https://api.vercel.com https://api.stripe.com https://api.clerk.com https://api.knock.app https://api.statsig.com https://sentry.io https://api.inngest.com https://supabase.co https://fitting-giraffe-9607.upstash.io",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  const headers = new Headers(res.headers);
  headers.set('Content-Security-Policy', csp);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()');
  
  // HSTS for production
  if (process.env.NODE_ENV === 'production') {
    headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  return NextResponse.next({
    request: {
      headers: req.headers,
    },
    headers
  });
}

export function generateNonce(): string {
  return nanoid();
}