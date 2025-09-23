import Statsig, { StatsigUser } from "statsig-node";

let initialized = false;

async function ensureInitialized() {
  if (!initialized && process.env.STATSIG_SERVER_SECRET_KEY) {
    await Statsig.initialize(process.env.STATSIG_SERVER_SECRET_KEY, {
      environment: { tier: process.env.NODE_ENV === "production" ? "production" : "development" },
    });
    initialized = true;
  }
}

/**
 * Check if a feature gate is enabled for a user
 */
export async function checkGate(
  gateName: string,
  user: StatsigUser
): Promise<boolean> {
  if (!process.env.STATSIG_SERVER_SECRET_KEY) {
    console.warn(`STATSIG_SERVER_SECRET_KEY not configured, gate '${gateName}' defaulting to false`);
    return false;
  }

  try {
    await ensureInitialized();
    return Statsig.checkGate(user, gateName);
  } catch (error) {
    console.error(`Error checking gate '${gateName}':`, error);
    return false; // Fail closed
  }
}

/**
 * Get feature gate value with default
 */
export async function getGate(
  gateName: string,
  user: StatsigUser,
  defaultValue: boolean = false
): Promise<boolean> {
  try {
    return await checkGate(gateName, user);
  } catch (error) {
    console.error(`Error getting gate '${gateName}', using default:`, error);
    return defaultValue;
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
  
  for (const gateName of gateNames) {
    results[gateName] = await checkGate(gateName, user);
  }
  
  return results;
}

/**
 * Feature gate helper for API routes
 */
export async function requireGate(
  gateName: string,
  user: StatsigUser
): Promise<void> {
  const enabled = await checkGate(gateName, user);
  if (!enabled) {
    throw new Error(`Feature '${gateName}' is not enabled for this user`);
  }
}

/**
 * Log an event to Statsig
 */
export async function logEvent(
  user: StatsigUser,
  eventName: string,
  value?: string | number,
  metadata?: Record<string, any>
): Promise<void> {
  if (!process.env.STATSIG_SERVER_SECRET_KEY) {
    return;
  }

  try {
    await ensureInitialized();
    Statsig.logEvent(user, eventName, value, metadata);
  } catch (error) {
    console.error(`Error logging event '${eventName}':`, error);
  }
}

/**
 * Create StatsigUser from session user
 */
export function createStatsigUser(sessionUser: {
  id: number;
  email: string;
  name?: string;
  role: string;
}): StatsigUser {
  return {
    userID: sessionUser.id.toString(),
    email: sessionUser.email,
    custom: {
      user_id: sessionUser.id,
      role: sessionUser.role,
      name: sessionUser.name,
    },
  };
}

/**
 * Predefined feature gates
 */
export const FeatureGates = {
  NEW_CREDIT_UI: "new_credit_ui",
  KB_UPLOADS_ENABLED: "kb_uploads_enabled", 
  ADMIN_PURGE_CONTROLS: "admin_purge_controls",
  AI_PRICING_ENABLED: "ai_pricing_enabled",
  AI_CREDIT_ENABLED: "ai_credit_enabled",
  AI_DATA_ENABLED: "ai_data_enabled",
  AI_TRAINING_ENABLED: "ai_training_enabled",
} as const;