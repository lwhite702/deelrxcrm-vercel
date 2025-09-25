/**
 * Documentation and External Links Redirect Configuration
 * 
 * This file defines redirects for documentation and external links to maintain
 * a clean URL structure and proper SEO.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Documentation site URL (Mintlify deployment)
const DOCS_BASE_URL = 'https://docs.deelrxcrm.app';

// External resource URLs
const EXTERNAL_LINKS = {
  github: 'https://github.com/lwhite702/deelrxcrm-vercel',
  support: 'https://deelrxcrm.app/support',
  status: 'https://status.deelrxcrm.app',
  community: 'https://discord.gg/deelrx'
} as const;

// Documentation redirects mapping
const DOCS_REDIRECTS = {
  // Legacy documentation routes
  '/docs': '/',
  '/documentation': '/',
  '/api-docs': '/api-reference/introduction',
  '/docs/getting-started': '/quickstart',
  '/docs/authentication': '/authentication',
  
  // Core CRM documentation
  '/docs/crm': '/core-crm/customers',
  '/docs/customers': '/core-crm/customers',
  '/docs/orders': '/core-crm/orders',
  '/docs/products': '/core-crm/products',
  '/docs/payments': '/core-crm/payments',
  
  // Extended operations
  '/docs/deliveries': '/extended-ops/deliveries',
  '/docs/loyalty': '/extended-ops/loyalty',
  '/docs/referrals': '/extended-ops/referrals',
  '/docs/adjustments': '/extended-ops/adjustments',
  
  // Credit system
  '/docs/credit': '/credit-kb/credit-overview',
  '/docs/knowledge-base': '/credit-kb/knowledge-base',
  '/docs/kb': '/credit-kb/knowledge-base',
  
  // Admin and configuration
  '/docs/admin': '/admin/team-management',
  '/docs/team': '/admin/team-management',
  '/docs/roles': '/admin/roles-permissions',
  '/docs/permissions': '/admin/roles-permissions',
  '/docs/data': '/admin/data-management',
  
  // API documentation
  '/docs/api': '/api-reference/introduction',
  '/docs/api/teams': '/api-reference/teams/get-team',
  '/docs/api/customers': '/api-reference/customers/list-customers',
  '/docs/api/credit': '/api-reference/credit/get-credit-status',
  '/docs/api/kb': '/api-reference/kb/list-articles',
  
  // Platform information
  '/docs/integrations': '/pages/integrations-overview',
  '/docs/pricing': '/pages/pricing-fees',
  '/docs/security': '/pages/privacy-security',
  '/docs/privacy': '/pages/privacy-security'
} as const;

/**
 * Create a redirect response to the documentation site
 */
function createDocsRedirect(path: string): NextResponse {
  const redirectUrl = `${DOCS_BASE_URL}${path}`;
  return NextResponse.redirect(redirectUrl, 301);
}

/**
 * Create a redirect response to an external link
 */
function createExternalRedirect(url: string): NextResponse {
  return NextResponse.redirect(url, 301);
}

/**
 * Handle documentation redirects
 */
export function handleDocsRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  
  // Check for direct documentation redirects
  if (pathname in DOCS_REDIRECTS) {
    const redirectPath = DOCS_REDIRECTS[pathname as keyof typeof DOCS_REDIRECTS];
    return createDocsRedirect(redirectPath);
  }
  
  // Handle dynamic API documentation routes
  if (pathname.startsWith('/docs/api/')) {
    const apiPath = pathname.replace('/docs/api/', '/api-reference/');
    return createDocsRedirect(apiPath);
  }
  
  // Handle general /docs/* routes
  if (pathname.startsWith('/docs/')) {
    const docPath = pathname.replace('/docs/', '/');
    return createDocsRedirect(docPath);
  }
  
  // Handle external link shortcuts
  if (pathname === '/github') {
    return createExternalRedirect(EXTERNAL_LINKS.github);
  }
  
  if (pathname === '/support') {
    return createExternalRedirect(EXTERNAL_LINKS.support);
  }
  
  if (pathname === '/status') {
    return createExternalRedirect(EXTERNAL_LINKS.status);
  }
  
  if (pathname === '/community') {
    return createExternalRedirect(EXTERNAL_LINKS.community);
  }
  
  return null;
}

/**
 * Get all configured documentation redirects for sitemap generation
 */
export function getDocsRedirectPaths(): string[] {
  return Object.keys(DOCS_REDIRECTS);
}

/**
 * Get the documentation base URL
 */
export function getDocsBaseUrl(): string {
  return DOCS_BASE_URL;
}