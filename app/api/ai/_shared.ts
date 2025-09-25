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
 * This function retrieves the authorization context for a specified team by calling
 * `requireTenantRole` with the provided teamId. If the role is successfully obtained,
 * it initializes Statsig and creates a Statsig user object using the retrieved
 * authorization context. The function returns both the authorization context and
 * the Statsig user object.
 *
 * @param teamId - The ID of the team for which to resolve authorization.
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

  const statsigUser = createStatsigUser({
    id: authContext.user.id,
    teamId: authContext.team?.id ?? teamId,
    role: authContext.team?.role,
  });

  return { authContext, statsigUser };
}

/**
 * Enforces the AI gate for a given user and feature.
 *
 * This function checks if the AI kill switch is active for the provided statsigUser.
 * If the kill switch is active, it throws an HttpError indicating that AI endpoints are disabled.
 * It then checks if the specified gate is enabled for the user; if not, it throws an HttpError indicating that the requested AI capability is disabled.
 *
 * @param {StatsigUser} statsigUser - The user for whom the AI gate is being enforced.
 * @param {FeatureGateKey} gate - The feature gate key to check for the user's access.
 */
export async function enforceAiGate(
  statsigUser: StatsigUser,
  gate: FeatureGateKey
): Promise<void> {
  const aiKill = await isKillSwitchActive(statsigUser);
  if (aiKill) {
    throw new HttpError("AI endpoints are temporarily disabled", 503);
  }

  const enabled = await isFeatureEnabled(gate, statsigUser);
  if (!enabled) {
    throw new HttpError("Requested AI capability is disabled", 403);
  }
}
