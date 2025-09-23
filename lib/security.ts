import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// CSP nonce generation and security headers
/**
 * Generates a Content Security Policy (CSP) nonce as a string.
 */
export function generateCSPNonce(): string {
  return randomUUID().replace(/-/g, '');
}

// Helper to get client IP from NextRequest
/**
 * Retrieves the client's IP address from the request headers.
 *
 * The function first checks for the 'x-forwarded-for' header, which may contain a list of IPs.
 * If present, it returns the first IP after trimming whitespace. If the 'x-real-ip' header is available,
 * it returns that value. If neither header is found, it defaults to returning 'unknown'.
 *
 * @param req - The NextRequest object containing the headers from which to extract the IP address.
 */
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Generates security headers for HTTP responses.
 */
export function getSecurityHeaders(nonce?: string): Record<string, string> {
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' ${nonce ? `'nonce-${nonce}'` : "'unsafe-inline'"} https://js.stripe.com https://checkout.stripe.com https://www.googletagmanager.com https://cdn.statsig.com`,
    `style-src 'self' ${nonce ? `'nonce-${nonce}'` : "'unsafe-inline'"} https://fonts.googleapis.com`,
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://api.knock.app https://api.statsig.com https://sentry.io https://api.inngest.com https://api.vercel.app",
    "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];

  return {
    'Content-Security-Policy': cspDirectives.join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self)',
    'Strict-Transport-Security': process.env.NODE_ENV === 'production' 
      ? 'max-age=31536000; includeSubDomains; preload' 
      : '',
  };
}

/**
 * Applies security headers to the given response.
 */
export function applySecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
  const headers = getSecurityHeaders(nonce);
  
  Object.entries(headers).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value);
    }
  });

  return response;
}

// Rate limiting types and utilities
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // Stripe webhooks - very restrictive
  'stripe-webhook': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: (req) => getClientIP(req),
  },
  
  // Authentication endpoints
  'auth': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (req) => getClientIP(req),
  },
  
  // File uploads
  'upload': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: (req) => {
      // Use user ID if available, fallback to IP
      const userId = req.headers.get('x-user-id');
      return userId || getClientIP(req);
    },
  },
  
  // Financial operations
  'financial': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyGenerator: (req) => {
      const userId = req.headers.get('x-user-id');
      return userId || getClientIP(req);
    },
  },
  
  // General API
  'api': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (req) => {
      const userId = req.headers.get('x-user-id');
      return userId || getClientIP(req);
    },
  },
  
  // Admin operations
  'admin': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    keyGenerator: (req) => {
      const userId = req.headers.get('x-user-id');
      return `admin:${userId || getClientIP(req)}`;
    },
  },
};

// Idempotency key utilities
/**
 * Generates a unique idempotency key.
 */
export function generateIdempotencyKey(): string {
  return `idem_${Date.now()}_${randomUUID()}`;
}

/**
 * Extracts the idempotency key from the request headers.
 */
export function extractIdempotencyKey(req: NextRequest): string | null {
  return req.headers.get('Idempotency-Key') || req.headers.get('x-idempotency-key');
}

// Environment variable validation
export interface RequiredEnvVars {
  [key: string]: {
    required: boolean;
    description: string;
    sensitive?: boolean;
  };
}

export const requiredEnvVars: RequiredEnvVars = {
  // Database
  'DATABASE_URL': {
    required: true,
    description: 'Neon PostgreSQL connection string',
    sensitive: true,
  },
  
  // Authentication
  'NEXTAUTH_SECRET': {
    required: true,
    description: 'NextAuth.js secret for JWT signing',
    sensitive: true,
  },
  'NEXTAUTH_URL': {
    required: true,
    description: 'Application base URL for callbacks',
  },
  
  // Stripe
  'STRIPE_SECRET_KEY': {
    required: true,
    description: 'Stripe secret key for API calls',
    sensitive: true,
  },
  'STRIPE_WEBHOOK_SECRET': {
    required: true,
    description: 'Stripe webhook endpoint secret',
    sensitive: true,
  },
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': {
    required: true,
    description: 'Stripe publishable key for client-side',
  },
  
  // Sentry
  'SENTRY_DSN': {
    required: false,
    description: 'Sentry DSN for error tracking',
    sensitive: true,
  },
  'NEXT_PUBLIC_SENTRY_DSN': {
    required: false,
    description: 'Public Sentry DSN for client-side error tracking',
  },
  
  // Statsig
  'STATSIG_SERVER_SECRET_KEY': {
    required: true,
    description: 'Statsig server-side secret key',
    sensitive: true,
  },
  'NEXT_PUBLIC_STATSIG_CLIENT_KEY': {
    required: true,
    description: 'Statsig client-side key',
  },
  
  // Knock
  'KNOCK_SECRET_KEY': {
    required: true,
    description: 'Knock API secret key for notifications',
    sensitive: true,
  },
  'NEXT_PUBLIC_KNOCK_PUBLIC_KEY': {
    required: true,
    description: 'Knock public key for client-side',
  },
  
  // Inngest
  'INNGEST_EVENT_KEY': {
    required: true,
    description: 'Inngest event key for background jobs',
    sensitive: true,
  },
  'INNGEST_SIGNING_KEY': {
    required: true,
    description: 'Inngest signing key for webhook verification',
    sensitive: true,
  },
  
  // Encryption
  'ENCRYPTION_KEY': {
    required: true,
    description: 'AES-256-GCM encryption key for sensitive data',
    sensitive: true,
  },
  
  // Redis (if using Upstash)
  'UPSTASH_REDIS_REST_URL': {
    required: false,
    description: 'Upstash Redis REST URL for rate limiting',
  },
  'UPSTASH_REDIS_REST_TOKEN': {
    required: false,
    description: 'Upstash Redis REST token',
    sensitive: true,
  },
};

/**
 * Validates the presence and status of required environment variables.
 *
 * The function checks each entry in the requiredEnvVars object to determine if the corresponding
 * environment variable is set. It categorizes missing variables as required or optional,
 * collecting warnings for optional variables that are not set. The function returns an object
 * indicating the validity of the environment variables, along with lists of missing variables
 * and warnings.
 */
export function validateEnvironmentVariables(): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  Object.entries(requiredEnvVars).forEach(([key, config]) => {
    const value = process.env[key];
    
    if (config.required && !value) {
      missing.push(`${key}: ${config.description}`);
    } else if (!config.required && !value) {
      warnings.push(`${key}: ${config.description} (optional but recommended)`);
    }
  });

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

// Security utilities
/**
 * Sanitizes the provided headers by filtering out allowed headers.
 */
export function sanitizeHeaders(headers: Headers): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const allowedHeaders = [
    'content-type',
    'user-agent',
    'accept',
    'accept-language',
    'cache-control',
    'x-forwarded-for',
    'x-real-ip',
  ];

  allowedHeaders.forEach(header => {
    const value = headers.get(header);
    if (value) {
      sanitized[header] = value;
    }
  });

  return sanitized;
}

/**
 * Checks if the application is running in production mode.
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Checks if the current environment is development.
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Retrieves the current environment name based on the VERCEL_ENV variable.
 *
 * The function checks the value of process.env.VERCEL_ENV to determine the environment.
 * If it is set to 'production', it returns 'production'. If it is 'preview', it returns 'preview'.
 * For any other value, it defaults to returning 'development'.
 */
export function getEnvironmentName(): string {
  if (process.env.VERCEL_ENV === 'production') return 'production';
  if (process.env.VERCEL_ENV === 'preview') return 'preview';
  return 'development';
}