/**
 * Content Map Utilities
 * 
 * Provides type-safe access to the centralized content map.
 * This enforces the "No Placeholder Policy" by ensuring all UI copy
 * comes from a single source of truth.
 */

import contentMap from '../content/content-map.json';

/**
 * Get content by dot-notation path
 * @param path - Dot-separated path to content (e.g., 'dashboard.title')
 * @returns The content string or object
 */
export function getContent(path: string): any {
  const keys = path.split('.');
  let current: any = contentMap;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      console.warn(`Content path not found: ${path}`);
      return path;
    }
  }
  
  return current;
}

/**
 * Template function for dynamic content with placeholders
 * @param path - Content path
 * @param variables - Variables to interpolate
 * @returns Processed content string
 */
export function getContentTemplate(
  path: string,
  variables: Record<string, string | number>
): string {
  const content = getContent(path);
  
  if (typeof content !== 'string') {
    console.warn(`Content at ${path} is not a string template`);
    return String(content);
  }
  
  return content.replace(/\{(\w+)\}/g, (match, key) => {
    return key in variables ? String(variables[key]) : match;
  });
}

/**
 * Get navigation content with type safety
 */
export const navigation = {
  customers: () => getContent('navigation.customers'),
  sales: () => getContent('navigation.sales'),
  analytics: () => getContent('navigation.analytics'),
  inventory: () => getContent('navigation.inventory'),
  credits: () => getContent('navigation.credits'),
  settings: () => getContent('navigation.settings'),
  knowledge_base: () => getContent('navigation.knowledge_base'),
} as const;

/**
 * Get quick access button labels
 */
export const quickAccess = {
  receiveInventory: () => getContent('quick_access.receive_inventory'),
  adjustInventory: () => getContent('quick_access.adjust_inventory'),
  checkout: () => getContent('quick_access.checkout'),
  creditPayment: () => getContent('quick_access.credit_payment'),
} as const;

/**
 * Get chart content with template support
 */
export const charts = {
  title: (chartName: string) => getContent('charts.revenue_trends'), // Generic fallback
  loading: (title: string) => getContentTemplate('charts.loading_title', { title }),
  error: (title: string) => getContentTemplate('charts.error_retry', { title }),
  empty: (type: string) => getContentTemplate('charts.empty_message', { type }),
  retryButton: () => getContent('charts.retry_button'),
} as const;

/**
 * Get common action labels
 */
export const actions = {
  save: () => getContent('actions.save'),
  cancel: () => getContent('actions.cancel'),
  delete: () => getContent('actions.delete'),
  edit: () => getContent('actions.edit'),
  add: () => getContent('actions.add'),
  remove: () => getContent('actions.remove'),
  submit: () => getContent('actions.submit'),
  loading: () => getContent('actions.loading'),
  pleaseWait: () => getContent('actions.please_wait'),
} as const;

/**
 * Get tooltip content
 */
export const tooltips = {
  refresh: () => getContent('tooltips.refresh'),
  collapseSidebar: () => getContent('tooltips.collapse_sidebar'),
  export: () => getContent('tooltips.export'),
} as const;

/**
 * Get skeleton/loading states
 */
export const skeletons = {
  table: () => getContent('skeletons.table'),
  card: () => getContent('skeletons.card'),
  chart: () => getContent('skeletons.chart'),
} as const;

/**
 * Get error messages
 */
export const errors = {
  notFound: () => getContent('errors.404'),
  serverError: () => getContent('errors.500'),
  kbNotFound: () => getContent('errors.kb_not_found'),
} as const;

/**
 * Validate that content exists (for CI/testing)
 */
export function validateContentPath(path: string): boolean {
  try {
    const keys = path.split('.');
    let current: any = contentMap;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}