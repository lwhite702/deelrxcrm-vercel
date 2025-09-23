import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Generate a unique nonce for each request
function generateNonce(): string {
  return uuidv4().replace(/-/g, '');
}

// CSP configuration
function buildCSP(nonce: string, isDev: boolean = false): string {
  const policies = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'${isDev ? " 'unsafe-inline'" : ''} https://js.stripe.com https://challenges.cloudflare.com https://static.cloudflareinsights.com`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' blob: data: https: http:",
    "media-src 'self' blob: data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "manifest-src 'self'",
    `connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://notify.bugsnag.com https://api.statsig.com https://events.statsig.com https://knock.app https://api.knock.app https://api.resend.com https://vitals.vercel-insights.com https://vercel.live https://o123456.ingest.sentry.io https://api.github.com https://deelrxcrm.vercel.app https://deelrxcrm.app${isDev ? ' ws://localhost:3000 ws://localhost:3001 http://localhost:3000 http://localhost:3001 https://localhost:3000 https://localhost:3001' : ''}`,
    "worker-src 'self' blob:",
    "child-src 'self'",
    "upgrade-insecure-requests"
  ];

  return policies.join('; ');
}

// Security headers configuration
function getSecurityHeaders(nonce: string, isDev: boolean = false): Record<string, string> {
  return {
    // Content Security Policy
    'Content-Security-Policy': buildCSP(nonce, isDev),
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy - disable unused browser features
    'Permissions-Policy': [
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'battery=()',
      'camera=()',
      'cross-origin-isolated=()',
      'display-capture=()',
      'document-domain=()',
      'encrypted-media=()',
      'execution-while-not-rendered=()',
      'execution-while-out-of-viewport=()',
      'fullscreen=()',
      'geolocation=()',
      'gyroscope=()',
      'keyboard-map=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'navigation-override=()',
      'payment=()',
      'picture-in-picture=()',
      'publickey-credentials-get=()',
      'screen-wake-lock=()',
      'sync-xhr=()',
      'usb=()',
      'web-share=()',
      'xr-spatial-tracking=()'
    ].join(', '),
    
    // Strict Transport Security (HTTPS only in production)
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }),
    
    // X-Frame-Options as fallback for older browsers
    'X-Frame-Options': 'DENY',
    
    // Prevent DNS rebinding attacks
    'X-DNS-Prefetch-Control': 'off',
    
    // Additional security headers
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none'
  };
}

export function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const isDev = process.env.NODE_ENV === 'development';
  
  // Create response
  const response = NextResponse.next();
  
  // Add security headers
  const securityHeaders = getSecurityHeaders(nonce, isDev);
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add nonce to request headers for use in components
  response.headers.set('x-nonce', nonce);
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};