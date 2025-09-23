import StatsigSDK, { StatsigUser } from 'statsig-node';

// Initialize Statsig (call this on server startup)
let initialized = false;

export async function initializeStatsig(): Promise<void> {
  if (initialized) return;
  
  const serverKey = process.env.STATSIG_SERVER_SECRET_KEY;
  if (!serverKey) {
    console.warn('STATSIG_SERVER_SECRET_KEY not found, feature gates will be disabled');
    return;
  }

  try {
    await StatsigSDK.initialize(serverKey, {
      environment: { tier: process.env.NODE_ENV === 'production' ? 'production' : 'development' }
    });
    initialized = true;
    console.log('Statsig initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Statsig:', error);
  }
}

/**
 * Feature gates configuration
 */
export const FEATURE_GATES = {
  // LLM/AI Features
  LLM_PRICING_ENABLED: 'llm_pricing_enabled',
  LLM_CREDIT_ENABLED: 'llm_credit_enabled', 
  LLM_DATA_ENABLED: 'llm_data_enabled',
  LLM_TRAINING_ENABLED: 'llm_training_enabled',
  
  // UI Features
  NEW_CREDIT_UI: 'new_credit_ui',
  KB_UPLOADS_ENABLED: 'kb_uploads_enabled',
  ADMIN_PURGE_CONTROLS: 'admin_purge_controls',
  SEARCH_ENABLED: 'search_enabled',
  
  // Kill Switches (should default to TRUE, turn OFF to disable)
  KILL_CREDIT_SYSTEM: 'kill_credit_system',
  KILL_KB_UPLOADS: 'kill_kb_uploads',
  KILL_AI_ENDPOINTS: 'kill_ai_endpoints',
} as const;

/**
 * Check if a feature gate is enabled for a user
 */
export async function checkGate(
  gateName: string, 
  user: StatsigUser
): Promise<boolean> {
  if (!initialized) {
    console.warn(`Statsig not initialized, defaulting gate ${gateName} to false`);
    return false;
  }

  try {
    const result = await StatsigSDK.checkGate(user, gateName);
    return result;
  } catch (error) {
    console.error(`Failed to check gate ${gateName}:`, error);
    return false; // Fail closed
  }
}

/**
 * Check multiple gates at once
 */
export async function checkGates(
  gateNames: string[],
  user: StatsigUser
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  
  for (const gate of gateNames) {
    results[gate] = await checkGate(gate, user);
  }
  
  return results;
}

/**
 * Create a Statsig user object from request context
 */
export function createStatsigUser(
  userId: string,
  metadata?: {
    tenantId?: string;
    email?: string;
    role?: string;
    plan?: string;
  }
): StatsigUser {
  return {
    userID: userId,
    custom: {
      tenant_id: metadata?.tenantId,
      role: metadata?.role,
      plan: metadata?.plan,
    },
    email: metadata?.email,
  };
}

/**
 * Middleware to check feature gates and block requests if disabled
 */
export function requireGate(gateName: string, defaultValue = false) {
  return async (
    user: StatsigUser,
    options?: { throwOnDisabled?: boolean }
  ): Promise<boolean> => {
    // Check kill switches first (they should default to true)
    const isKillSwitch = gateName.startsWith('kill_');
    
    const enabled = await checkGate(gateName, user);
    
    // For kill switches, if enabled=true, it means the feature is DISABLED
    const featureAllowed = isKillSwitch ? !enabled : enabled;
    
    if (!featureAllowed && options?.throwOnDisabled) {
      throw new Error(`Feature ${gateName} is disabled`);
    }
    
    return featureAllowed;
  };
}

/**
 * Express/Next.js middleware to enforce gates
 */
export function gateMiddleware(gateName: string) {
  return async (req: any, res: any, next: any) => {
    // Extract user info from request (adjust based on your auth system)
    const userId = req.headers['x-user-id'] || req.user?.id;
    const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = createStatsigUser(userId, { tenantId });
    const gateCheck = requireGate(gateName);
    
    try {
      const allowed = await gateCheck(user, { throwOnDisabled: true });
      if (!allowed) {
        return res.status(403).json({ 
          error: `Feature ${gateName} is not available`,
          code: 'FEATURE_DISABLED'
        });
      }
      next();
    } catch (error) {
      return res.status(403).json({ 
        error: error instanceof Error ? error.message : 'Feature disabled',
        code: 'FEATURE_DISABLED'
      });
    }
  };
}

/**
 * Get configuration for a dynamic config
 */
export async function getDynamicConfig(
  configName: string,
  user: StatsigUser,
  defaultValue: any = {}
): Promise<any> {
  if (!initialized) {
    return defaultValue;
  }

  try {
    const config = await StatsigSDK.getConfig(user, configName);
    return config.getValue(configName, defaultValue);
  } catch (error) {
    console.error(`Failed to get config ${configName}:`, error);
    return defaultValue;
  }
}

/**
 * Shutdown Statsig (call on app shutdown)
 */
export async function shutdownStatsig(): Promise<void> {
  if (initialized) {
    await StatsigSDK.shutdown();
    initialized = false;
  }
}