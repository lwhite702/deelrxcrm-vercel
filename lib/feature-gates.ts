import Statsig from 'statsig-node';

// Initialize Statsig server instance
let statsigInitialized = false;

/**
 * Initializes the Statsig SDK if it has not been initialized yet.
 *
 * This function checks if the Statsig SDK is already initialized. If not, it retrieves the STATSIG_SERVER_SECRET_KEY from the environment variables. If the key is missing, a warning is logged, and the function exits. If the key is present, it attempts to initialize Statsig with the provided secret key and environment tier. Upon successful initialization, a success message is logged; otherwise, an error message is displayed.
 */
export async function initializeStatsig(): Promise<void> {
  if (statsigInitialized) return;

  const secretKey = process.env.STATSIG_SERVER_SECRET_KEY;
  if (!secretKey) {
    console.warn('STATSIG_SERVER_SECRET_KEY not found, feature gates will be disabled');
    return;
  }

  try {
    await Statsig.initialize(secretKey, {
      environment: {
        tier: process.env.VERCEL_ENV || 'development',
      },
    });
    statsigInitialized = true;
    console.log('Statsig initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Statsig:', error);
  }
}

// Feature gate definitions
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

  // System Kill Switches (default OFF, emergency use)
  KILL_CREDIT_SYSTEM: 'kill_credit_system',
  KILL_KB_UPLOADS: 'kill_kb_uploads', 
  KILL_AI_ENDPOINTS: 'kill_ai_endpoints',
  KILL_PAYMENTS: 'kill_payments',
} as const;

export type FeatureGateKey = typeof FEATURE_GATES[keyof typeof FEATURE_GATES];

// User context for feature gates
export interface StatsigUser {
  userID: string;
  email?: string;
  tenantId?: string;
  role?: string;
  plan?: string;
  customIDs?: Record<string, string>;
}

// Feature gate checker with fallback
/**
 * Checks if a feature is enabled for a given user based on the feature gate key.
 *
 * The function first verifies if Statsig is initialized. If not, it determines if the gate is a kill switch
 * and returns the appropriate boolean value. If Statsig is initialized, it attempts to check the feature gate
 * using the Statsig.checkGate method. In case of an error, it logs the error and applies the same logic for
 * kill switches to return the result.
 *
 * @param gate - The feature gate key to check.
 * @param user - The user for whom the feature gate is being checked.
 */
export async function isFeatureEnabled(
  gate: FeatureGateKey,
  user: StatsigUser
): Promise<boolean> {
  if (!statsigInitialized) {
    // Fail closed for kill switches, fail open for feature gates
    const isKillSwitch = gate.startsWith('kill_');
    return !isKillSwitch;
  }

  try {
    return await Statsig.checkGate(user, gate);
  } catch (error) {
    console.error(`Error checking feature gate ${gate}:`, error);
    // Fail closed for kill switches, fail open for others
    const isKillSwitch = gate.startsWith('kill_');
    return !isKillSwitch;
  }
}

// Check multiple gates at once
/**
 * Checks the status of feature gates for a given user.
 */
export async function checkFeatureGates(
  gates: FeatureGateKey[],
  user: StatsigUser
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  
  for (const gate of gates) {
    results[gate] = await isFeatureEnabled(gate, user);
  }
  
  return results;
}

// Dynamic config for feature parameters
export const DYNAMIC_CONFIGS = {
  RATE_LIMITS: 'rate_limits',
  AI_SETTINGS: 'ai_settings',
  CREDIT_SETTINGS: 'credit_settings',
  UPLOAD_SETTINGS: 'upload_settings',
} as const;

export type DynamicConfigKey = typeof DYNAMIC_CONFIGS[keyof typeof DYNAMIC_CONFIGS];

/**
 * Retrieves the dynamic configuration for a given user.
 *
 * This function checks if Statsig has been initialized. If not, it returns the default configuration using getDefaultConfig.
 * If initialized, it attempts to fetch the dynamic configuration using Statsig.getConfig. In case of an error during the fetch,
 * it logs the error and falls back to the default configuration.
 *
 * @param {DynamicConfigKey} config - The key for the dynamic configuration to retrieve.
 * @param {StatsigUser} user - The user for whom the dynamic configuration is being fetched.
 */
export async function getDynamicConfig(
  config: DynamicConfigKey,
  user: StatsigUser
): Promise<any> {
  if (!statsigInitialized) {
    return getDefaultConfig(config);
  }

  try {
    const dynamicConfig = await Statsig.getConfig(user, config);
    return dynamicConfig.value;
  } catch (error) {
    console.error(`Error getting dynamic config ${config}:`, error);
    return getDefaultConfig(config);
  }
}

// Default configurations when Statsig is unavailable
/**
 * Retrieve the default configuration based on the specified dynamic config key.
 *
 * The function uses a switch statement to return different configuration objects depending on the value of the config parameter.
 * Each case corresponds to a specific set of configurations, such as rate limits, AI settings, credit settings, and upload settings.
 * If the config does not match any predefined cases, an empty object is returned.
 *
 * @param config - The dynamic configuration key to retrieve the corresponding settings.
 * @returns The default configuration object for the specified dynamic config key.
 */
function getDefaultConfig(config: DynamicConfigKey): any {
  switch (config) {
    case DYNAMIC_CONFIGS.RATE_LIMITS:
      return {
        api_requests_per_minute: 1000,
        file_uploads_per_minute: 20,
        credit_operations_per_minute: 10,
        admin_operations_per_minute: 20,
      };
    
    case DYNAMIC_CONFIGS.AI_SETTINGS:
      return {
        max_context_length: 4000,
        temperature: 0.7,
        max_tokens: 500,
        enabled_features: ['summarization', 'analysis'],
      };
    
    case DYNAMIC_CONFIGS.CREDIT_SETTINGS:
      return {
        max_credit_limit: 100000, // $1000
        default_payment_terms: 'net30',
        late_fee_rate: 0.015, // 1.5%
        grace_period_days: 5,
      };
    
    case DYNAMIC_CONFIGS.UPLOAD_SETTINGS:
      return {
        max_file_size: 10 * 1024 * 1024, // 10MB
        allowed_mime_types: [
          'image/jpeg',
          'image/png', 
          'image/gif',
          'application/pdf',
          'text/plain',
        ],
        max_files_per_user: 100,
      };
    
    default:
      return {};
  }
}

// Middleware helpers for route protection
/**
 * Ensures a feature gate is enabled for a user before proceeding.
 */
export function requireFeatureGate(gate: FeatureGateKey) {
  return async (user: StatsigUser, next: () => Promise<any>) => {
    const enabled = await isFeatureEnabled(gate, user);
    
    if (!enabled) {
      throw new Error(`Feature ${gate} is not enabled for this user`);
    }
    
    return next();
  };
}

// Kill switch checker for critical operations
/**
 * Checks the status of various kill switches for a user.
 */
export async function checkKillSwitches(user: StatsigUser): Promise<{
  creditSystemKilled: boolean;
  kbUploadsKilled: boolean;
  aiEndpointsKilled: boolean;
  paymentsKilled: boolean;
}> {
  const [creditKill, kbKill, aiKill, paymentsKill] = await Promise.all([
    isFeatureEnabled(FEATURE_GATES.KILL_CREDIT_SYSTEM, user),
    isFeatureEnabled(FEATURE_GATES.KILL_KB_UPLOADS, user),
    isFeatureEnabled(FEATURE_GATES.KILL_AI_ENDPOINTS, user),
    isFeatureEnabled(FEATURE_GATES.KILL_PAYMENTS, user),
  ]);

  return {
    creditSystemKilled: creditKill,
    kbUploadsKilled: kbKill,
    aiEndpointsKilled: aiKill,
    paymentsKilled: paymentsKill,
  };
}

// Log feature gate evaluation for debugging
/**
 * Logs the evaluation of a feature gate for a user.
 *
 * This function checks the current environment and logs the feature gate evaluation result.
 * In development, it outputs the result to the console. In production, it attempts to log the
 * event using the Statsig analytics service, capturing relevant user information. If logging fails,
 * it catches the error and logs it to the console.
 *
 * @param gate - The key of the feature gate being evaluated.
 * @param user - The user for whom the feature gate is evaluated.
 * @param result - The boolean result of the feature gate evaluation.
 */
export async function logFeatureGateEvaluation(
  gate: FeatureGateKey,
  user: StatsigUser,
  result: boolean
): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Feature gate ${gate} evaluated to ${result} for user ${user.userID}`);
  }
  
  // In production, you might want to send this to your analytics service
  if (process.env.NODE_ENV === 'production') {
    try {
      await Statsig.logEvent(user, 'feature_gate_evaluation', gate, {
        result,
        tenantId: user.tenantId,
        role: user.role,
      });
    } catch (error) {
      console.error('Failed to log feature gate evaluation:', error);
    }
  }
}

// Cleanup on shutdown
/**
 * Shuts down Statsig if it has been initialized.
 */
export async function shutdownStatsig(): Promise<void> {
  if (statsigInitialized) {
    await Statsig.shutdown();
    statsigInitialized = false;
  }
}

// Export for use in API routes and components
export { Statsig };