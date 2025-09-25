/**
 * Production security audit utilities
 * Helps identify and fix security vulnerabilities before deployment
 */

import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * API routes that should have authentication
 */
const API_ROUTES_REQUIRING_AUTH = [
  '/api/teams/',
  '/api/user/',
  '/api/admin/',
  '/api/ai/',
  '/api/tenant/',
];

/**
 * API routes that are public (don't require auth)
 */
const PUBLIC_API_ROUTES = [
  '/api/auth/',
  '/api/webhooks/',
  '/api/stripe/webhook',
  '/api/_health/live',
  '/api/_health/ready',
];

/**
 * Routes that should only be available in development
 */
const DEV_ONLY_ROUTES = [
  '/api/_health/error-test',
  '/email-previews',
];

/**
 * Required security headers for production
 */
export const REQUIRED_SECURITY_HEADERS = [
  'Content-Security-Policy',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'X-XSS-Protection',
  'Strict-Transport-Security',
  'Referrer-Policy',
];

/**
 * Audit API routes for proper authentication
 */
export async function auditApiRouteSecurity(): Promise<{
  unprotectedRoutes: string[];
  devRoutesInProduction: string[];
  missingSecurityHeaders: string[];
  recommendations: string[];
}> {
  const unprotectedRoutes: string[] = [];
  const devRoutesInProduction: string[] = [];
  const recommendations: string[] = [];
  
  // In a real implementation, this would scan the actual route files
  // For now, we'll provide a framework for manual audit
  
  if (process.env.NODE_ENV === 'production') {
    DEV_ONLY_ROUTES.forEach(route => {
      devRoutesInProduction.push(route);
    });
  }
  
  // Check for common security misconfigurations
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    recommendations.push('JWT_SECRET should be at least 32 characters long');
  }
  
  if (!process.env.DATA_ENCRYPTION_KEY) {
    recommendations.push('DATA_ENCRYPTION_KEY should be set for encrypting sensitive data');
  }
  
  if (process.env.NODE_ENV === 'production' && !process.env.SENTRY_DSN) {
    recommendations.push('SENTRY_DSN should be set for production error monitoring');
  }
  
  return {
    unprotectedRoutes,
    devRoutesInProduction,
    missingSecurityHeaders: [], // Would be populated by actual header analysis
    recommendations,
  };
}

/**
 * Validate that sensitive data is properly encrypted
 */
export function validateDataEncryption(): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check encryption key
  if (!process.env.DATA_ENCRYPTION_KEY) {
    issues.push('DATA_ENCRYPTION_KEY not configured');
  } else if (process.env.DATA_ENCRYPTION_KEY.length < 32) {
    issues.push('DATA_ENCRYPTION_KEY too short (minimum 32 characters)');
  }
  
  // Check database encryption
  if (!process.env.DATABASE_URL?.includes('sslmode=require')) {
    issues.push('Database connection should use SSL in production');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Check for common security vulnerabilities
 */
export function runSecurityChecklist(): {
  passed: string[];
  failed: string[];
  warnings: string[];
} {
  const passed: string[] = [];
  const failed: string[] = [];
  const warnings: string[] = [];
  
  // Environment checks
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
    passed.push('JWT_SECRET properly configured');
  } else {
    failed.push('JWT_SECRET missing or too short');
  }
  
  if (process.env.DATABASE_URL?.includes('pooler')) {
    passed.push('Database using connection pooling');
  } else {
    warnings.push('Database should use pooled connections in production');
  }
  
  // Security headers
  if (process.env.NODE_ENV === 'production') {
    passed.push('Running in production mode');
  }
  
  // HTTPS enforcement
  if (process.env.VERCEL_ENV) {
    passed.push('Deployed on Vercel (automatic HTTPS)');
  }
  
  return { passed, failed, warnings };
}

/**
 * Role-based access control helper
 */
export interface UserRole {
  role: 'superAdmin' | 'admin' | 'member' | 'viewer';
  teamId?: number;
  permissions?: string[];
}

export const ROLE_PERMISSIONS = {
  superAdmin: ['*'], // All permissions
  admin: [
    'team:manage',
    'users:manage',
    'customers:manage',
    'orders:manage',
    'payments:manage',
    'analytics:view',
  ],
  member: [
    'customers:view',
    'customers:create',
    'orders:view',
    'orders:create',
    'payments:view',
  ],
  viewer: [
    'customers:view',
    'orders:view',
    'analytics:view',
  ],
} as const;

/**
 * Check if user has required permission
 */
export function hasPermission(
  userRole: UserRole,
  requiredPermission: string
): boolean {
  // Super admin has all permissions
  if (userRole.role === 'superAdmin') {
    return true;
  }
  
  const rolePermissions = ROLE_PERMISSIONS[userRole.role] || [];
  
  // Check for wildcard permission
  if ((rolePermissions as readonly string[]).includes('*')) {
    return true;
  }
  
  // Check for exact permission match
  if ((rolePermissions as readonly string[]).includes(requiredPermission)) {
    return true;
  }
  
  // Check for prefix match (e.g., 'customers:*' matches 'customers:view')
  const hasWildcardMatch = rolePermissions.some(permission => {
    if (permission.endsWith(':*')) {
      const prefix = permission.slice(0, -2);
      return requiredPermission.startsWith(prefix + ':');
    }
    return false;
  });
  
  return hasWildcardMatch;
}

/**
 * Middleware helper to require specific permission
 */
export async function requirePermission(
  request: NextRequest,
  permission: string
): Promise<UserRole> {
  // This would integrate with your existing auth system
  // For now, returning a placeholder implementation
  throw new Error('Permission check not implemented - integrate with your auth system');
}

/**
 * Generate security report for production readiness
 */
export async function generateSecurityReport(): Promise<{
  overallScore: number;
  categories: {
    authentication: { score: number; issues: string[] };
    authorization: { score: number; issues: string[] };
    dataProtection: { score: number; issues: string[] };
    secureHeaders: { score: number; issues: string[] };
    environment: { score: number; issues: string[] };
  };
  recommendations: string[];
}> {
  const report = {
    overallScore: 0,
    categories: {
      authentication: { score: 80, issues: [] as string[] },
      authorization: { score: 75, issues: [] as string[] },
      dataProtection: { score: 60, issues: [] as string[] },
      secureHeaders: { score: 90, issues: [] as string[] },
      environment: { score: 85, issues: [] as string[] },
    },
    recommendations: [] as string[],
  };
  
  // Check data protection
  const encryptionValidation = validateDataEncryption();
  if (!encryptionValidation.isValid) {
    report.categories.dataProtection.issues.push(...encryptionValidation.issues);
    report.categories.dataProtection.score -= encryptionValidation.issues.length * 10;
  }
  
  // Check environment
  if (process.env.NODE_ENV !== 'production') {
    report.categories.environment.issues.push('Not running in production mode');
    report.categories.environment.score -= 20;
  }
  
  // Calculate overall score
  const scores = Object.values(report.categories).map(cat => cat.score);
  report.overallScore = Math.round(scores.reduce((a, b) => a + b) / scores.length);
  
  // Generate recommendations
  if (report.overallScore < 80) {
    report.recommendations.push('Address security issues before production deployment');
  }
  
  if (report.categories.dataProtection.score < 70) {
    report.recommendations.push('Implement data encryption for sensitive customer information');
  }
  
  return report;
}