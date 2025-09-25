/**
 * SimpleLogin API Integration
 * 
 * This module provides functions to create and manage SimpleLogin aliases
 * for privacy-focused email handling in DeelRxCRM.
 * 
 * Environment variables required:
 * - SIMPLELOGIN_API_KEY: Your SimpleLogin API key
 * - SIMPLELOGIN_API_URL: API base URL (defaults to https://api.simplelogin.io)
 * - SIMPLELOGIN_ALIAS_DOMAIN: Optional custom domain for aliases
 */

export interface AliasResponse {
  alias: string;
  aliasId: string;
}

export interface SimpleLoginApiError extends Error {
  status?: number;
  code?: string;
}

const API_BASE = process.env.SIMPLELOGIN_API_URL || 'https://api.simplelogin.io';
const API_KEY = process.env.SIMPLELOGIN_API_KEY;
const ALIAS_DOMAIN = process.env.SIMPLELOGIN_ALIAS_DOMAIN;

if (!API_KEY) {
  console.warn('SIMPLELOGIN_API_KEY not configured - alias creation will fail');
}

/**
 * Creates a new SimpleLogin alias
 * @param options Configuration for alias creation
 * @returns Promise containing the alias email and ID
 * @throws SimpleLoginApiError on API failures
 */
export async function createAlias(options: {
  note?: string;
}): Promise<AliasResponse> {
  if (!API_KEY) {
    throw new Error('SimpleLogin API key not configured');
  }

  const body: Record<string, any> = {};
  
  if (options.note) {
    body.note = options.note;
  }
  
  if (ALIAS_DOMAIN) {
    body.hostname = ALIAS_DOMAIN;
  }

  try {
    const response = await fetch(`${API_BASE}/api/aliases`, {
      method: 'POST',
      headers: {
        'Authentication': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      const error = new Error(`SimpleLogin API error: ${response.status}`) as SimpleLoginApiError;
      error.status = response.status;
      
      // Don't leak sensitive information in error messages
      if (response.status === 401) {
        error.message = 'Authentication failed - check API key configuration';
      } else if (response.status === 429) {
        error.message = 'Rate limit exceeded - try again later';
      } else if (response.status >= 500) {
        error.message = 'SimpleLogin service temporarily unavailable';
      } else {
        error.message = 'Failed to create alias - please try again';
      }
      
      throw error;
    }

    const data = await response.json();
    
    if (!data.email || !data.id) {
      throw new Error('Invalid response from SimpleLogin API');
    }

    return {
      alias: data.email,
      aliasId: data.id.toString(),
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'TypeError') {
      // Network error
      throw new Error('Unable to connect to SimpleLogin service');
    }
    throw error;
  }
}

/**
 * Disables a SimpleLogin alias
 * @param options Alias configuration
 * @throws SimpleLoginApiError on API failures
 */
export async function disableAlias(options: {
  aliasId: string;
}): Promise<void> {
  if (!API_KEY) {
    throw new Error('SimpleLogin API key not configured');
  }

  try {
    const response = await fetch(`${API_BASE}/api/aliases/${options.aliasId}/toggle`, {
      method: 'POST',
      headers: {
        'Authentication': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = new Error(`Failed to disable alias: ${response.status}`) as SimpleLoginApiError;
      error.status = response.status;
      
      if (response.status === 401) {
        error.message = 'Authentication failed - check API key configuration';
      } else if (response.status === 404) {
        error.message = 'Alias not found';
      } else if (response.status >= 500) {
        error.message = 'SimpleLogin service temporarily unavailable';
      } else {
        error.message = 'Failed to disable alias';
      }
      
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'TypeError') {
      throw new Error('Unable to connect to SimpleLogin service');
    }
    throw error;
  }
}

/**
 * Validates alias forwarding capability
 * This is a stub implementation - in production you could:
 * 1. Send a test email via Resend to the alias (dev only)
 * 2. Use SimpleLogin API to check alias status if available
 * 3. Check recent delivery metrics
 * 
 * @param alias The alias email to validate
 * @returns Promise with validation status
 */
export async function validateForwarding(alias: string): Promise<"ok" | "warning" | "error"> {
  // TODO: Implement actual validation logic
  // For now, return "ok" as a stub
  // 
  // In a real implementation, you might:
  // - Check if the alias domain matches expected patterns
  // - Send a test email and wait for delivery confirmation
  // - Query SimpleLogin API for alias status
  // - Check recent bounce/complaint history
  
  if (!alias || !alias.includes('@')) {
    return "error";
  }
  
  // Basic domain validation
  const domain = alias.split('@')[1];
  if (!domain || domain.length < 3) {
    return "error";
  }
  
  return "ok";
}

/**
 * Gets alias information from SimpleLogin API
 * @param aliasId The SimpleLogin alias ID
 * @returns Promise with alias details or null if not found
 */
export async function getAliasInfo(aliasId: string): Promise<{
  alias: string;
  enabled: boolean;
  note?: string;
} | null> {
  if (!API_KEY || !aliasId) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/api/aliases/${aliasId}`, {
      method: 'GET',
      headers: {
        'Authentication': API_KEY,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      console.error(`SimpleLogin API error getting alias info: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return {
      alias: data.email,
      enabled: data.enabled,
      note: data.note,
    };
  } catch (error) {
    console.error('Error fetching alias info:', error);
    return null;
  }
}