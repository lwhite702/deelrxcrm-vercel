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

export const REQUEST_BYTE_LIMIT = 32 * 1024; // 32KB
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
