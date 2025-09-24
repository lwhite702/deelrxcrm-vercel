import { z } from "zod";

import {
  FEATURE_GATES,
  initializeStatsig,
  createStatsigUser,
  isFeatureEnabled,
  isKillSwitchActive,
  type FeatureGateKey,
  type StatsigUser,
} from "@/lib/feature-gates";
import { requireTenantRole, type AuthContext } from "@/lib/auth/guards";

export const REQUEST_BYTE_LIMIT = 8 * 1024; // 8KB
export const TeamIdSchema = z.object({ teamId: z.number().int().positive() });

export class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Parse a bounded JSON from the request body.
 *
 * This function retrieves the raw text from the request, checks for an empty body, and validates the size of the payload against a predefined limit. If the payload is valid, it attempts to parse the JSON; if any checks fail or parsing throws an error, an HttpError is thrown with the appropriate status code.
 *
 * @param request - The HTTP request object containing the body to be parsed.
 * @returns A Promise that resolves to the parsed JSON object.
 * @throws HttpError If the request body is empty, exceeds the size limit, or contains invalid JSON.
 */
export async function parseBoundedJson(request: Request): Promise<any> {
  const raw = await request.text();

  if (!raw || raw.trim().length === 0) {
    throw new HttpError("Empty request body", 400);
  }

  const size = Buffer.byteLength(raw, "utf8");
  if (size > REQUEST_BYTE_LIMIT) {
    throw new HttpError("Request payload exceeds limit", 413);
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError("Invalid JSON payload", 400);
  }
}

/**
 * Resolves AI authorization for a given team.
 *
 * This function retrieves the authorization context for a team identified by teamId, ensuring the user has the appropriate role.
 * It initializes the Statsig service and creates a Statsig user object based on the retrieved authorization context.
 * If the user does not have the required role, an error is thrown.
 *
 * @param {number} teamId - The ID of the team for which to resolve authorization.
 */
export async function resolveAiAuthorization(teamId: number): Promise<{
  authContext: AuthContext;
  statsigUser: StatsigUser;
}> {
  let authContext: AuthContext;

  try {
    authContext = await requireTenantRole(teamId, "owner", "manager");
  } catch {
    throw new HttpError("Tenant access denied", 403);
  }

  await initializeStatsig();

  const statsigUser = createStatsigUser(authContext.user.id, {
    email: authContext.user.email,
    role: authContext.team?.role,
    tenantId: authContext.team?.id ?? teamId,
  });

  return { authContext, statsigUser };
}

/**
 * Enforces the AI gate by checking the status of the AI kill switch and feature availability.
 *
 * This function first checks if the AI endpoints are disabled by calling isKillSwitchActive.
 * If the kill switch is active, it throws an HttpError indicating that AI endpoints are temporarily disabled.
 * Next, it verifies if the requested feature gate is enabled for the given statsigUser.
 * If the feature is not enabled, it throws an HttpError indicating that the requested AI capability is disabled.
 *
 * @param {StatsigUser} statsigUser - The user object containing information for feature gating.
 * @param {FeatureGateKey} gate - The key representing the feature gate to be checked.
 */
export async function enforceAiGate(
  statsigUser: StatsigUser,
  gate: FeatureGateKey
): Promise<void> {
  const aiKill = await isKillSwitchActive(FEATURE_GATES.KILL_AI_ENDPOINTS, statsigUser);
  if (aiKill) {
    throw new HttpError("AI endpoints are temporarily disabled", 503);
  }

  const enabled = await isFeatureEnabled(gate, statsigUser);
  if (!enabled) {
    throw new HttpError("Requested AI capability is disabled", 403);
  }
}
