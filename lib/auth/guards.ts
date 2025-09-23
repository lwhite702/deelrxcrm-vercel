import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/session";
import { db } from "@/lib/db/drizzle";
import { users, teams, teamMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export type TenantRole = 'owner' | 'manager' | 'staff';

export interface AuthContext {
  user: {
    id: number;
    email: string;
    name?: string;
    role: string;
  };
  team?: {
    id: number;
    name: string;
    role: TenantRole;
  };
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<AuthContext['user'] | null> {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    const sessionData = await verifyToken(sessionCookie.value);
    if (!sessionData || !sessionData.user || !sessionData.user.id) {
      return null;
    }

    // Fetch full user data from database since session only contains ID
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, sessionData.user.id))
      .limit(1);

    if (!user || user.length === 0) {
      return null;
    }

    // Default role - in a real app, this would come from team membership or user table
    return {
      id: user[0].id,
      email: user[0].email,
      name: user[0].name || undefined,
      role: 'owner' // Default role, should be determined from team membership
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Require authenticated user, throw if not found
 */
export async function requireAuth(): Promise<AuthContext['user']> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Get user's team membership and role
 */
export async function getUserTeamContext(userId: number, teamId: number): Promise<AuthContext['team'] | null> {
  try {
    const [membership] = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        role: teamMembers.role,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teams.id, teamMembers.teamId))
      .where(
        and(
          eq(teamMembers.userId, userId),
          eq(teamMembers.teamId, teamId)
        )
      )
      .limit(1);

    if (!membership) {
      return null;
    }

    return {
      id: membership.teamId,
      name: membership.teamName,
      role: membership.role as TenantRole,
    };
  } catch (error) {
    console.error('Error getting team context:', error);
    return null;
  }
}

/**
 * Require user to be member of specified tenant
 */
export async function requireTenant(teamId: number): Promise<AuthContext> {
  const user = await requireAuth();
  const team = await getUserTeamContext(user.id, teamId);
  
  if (!team) {
    throw new Error('Tenant access denied');
  }

  return { user, team };
}

/**
 * Require user to have specific role(s) in tenant
 */
export async function requireTenantRole(
  teamId: number, 
  ...allowedRoles: TenantRole[]
): Promise<AuthContext> {
  const context = await requireTenant(teamId);
  
  if (!allowedRoles.includes(context.team!.role)) {
    throw new Error(`Role access denied. Required: ${allowedRoles.join(', ')}, Current: ${context.team!.role}`);
  }

  return context;
}

/**
 * Extract team ID from request URL or body
 */
export function extractTeamId(request: NextRequest): number | null {
  // Try URL params first (e.g., /api/teams/[teamId]/...)
  const urlParts = request.nextUrl.pathname.split('/');
  const teamsIndex = urlParts.indexOf('teams');
  if (teamsIndex >= 0 && urlParts[teamsIndex + 1]) {
    const teamId = parseInt(urlParts[teamsIndex + 1]);
    if (!isNaN(teamId)) {
      return teamId;
    }
  }

  // Try query params
  const teamIdParam = request.nextUrl.searchParams.get('teamId');
  if (teamIdParam) {
    const teamId = parseInt(teamIdParam);
    if (!isNaN(teamId)) {
      return teamId;
    }
  }

  return null;
}

/**
 * Middleware helper for API routes
 */
export async function withAuth<T>(
  request: NextRequest,
  handler: (context: AuthContext) => Promise<T>
): Promise<T> {
  const user = await requireAuth();
  const teamId = extractTeamId(request);
  
  let team: AuthContext['team'] | undefined;
  if (teamId) {
    const teamContext = await getUserTeamContext(user.id, teamId);
    if (!teamContext) {
      throw new Error('Tenant access denied');
    }
    team = teamContext;
  }

  return handler({ user, team });
}

/**
 * Middleware helper for API routes with role requirements
 */
export async function withTenantRole<T>(
  request: NextRequest,
  allowedRoles: TenantRole[],
  handler: (context: AuthContext) => Promise<T>
): Promise<T> {
  const teamId = extractTeamId(request);
  if (!teamId) {
    throw new Error('Team ID required');
  }

  const context = await requireTenantRole(teamId, ...allowedRoles);
  return handler(context);
}