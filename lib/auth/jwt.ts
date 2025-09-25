import type { NextRequest } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';

export type AppJwtRole = 'user' | 'admin' | 'superAdmin';

export interface AppJwtPayload extends JWTPayload {
  sub: string;
  email?: string;
  role?: AppJwtRole;
  tenantId?: string;
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

const ROLE_PRIORITY: Record<AppJwtRole, number> = {
  user: 0,
  admin: 1,
  superAdmin: 2,
};

function parseCookie(headerValue: string | null): Record<string, string> {
  if (!headerValue) {
    return {};
  }

  return headerValue.split(';').reduce<Record<string, string>>((acc, part) => {
    const [name, ...rest] = part.trim().split('=');
    if (!name) {
      return acc;
    }

    const value = rest.join('=');

    try {
      acc[name] = decodeURIComponent(value ?? '');
    } catch {
      acc[name] = value ?? '';
    }

    return acc;
  }, {});
}

export function getTokenFromRequest(req: Request | NextRequest): string | null {
  const maybeNextReq = req as NextRequest;

  if (typeof maybeNextReq.cookies?.get === 'function') {
    const cookieToken = maybeNextReq.cookies.get('auth_token')?.value;
    if (cookieToken) {
      return cookieToken;
    }
  }

  const cookieHeader = req.headers.get('cookie');
  const parsedCookies = parseCookie(cookieHeader);
  if (parsedCookies.auth_token) {
    return parsedCookies.auth_token;
  }

  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    return token.length > 0 ? token : null;
  }

  return null;
}

export async function verifyJwt<T extends AppJwtPayload = AppJwtPayload>(
  token: string
): Promise<T> {
  if (!token) {
    throw new AuthError('Missing token', 401);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  const secretKey = new TextEncoder().encode(secret);

  const { JWT_ISSUER, JWT_AUDIENCE } = process.env;

  try {
    const { payload } = await jwtVerify<T>(token, secretKey, {
      issuer: JWT_ISSUER || undefined,
      audience: JWT_AUDIENCE || undefined,
      algorithms: ['HS256'],
    });

    if (!payload.sub) {
      throw new AuthError('Invalid token payload', 401);
    }

    return payload;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    throw new AuthError('Invalid or expired token', 401);
  }
}

export async function requireRole(
  req: Request | NextRequest,
  role: AppJwtRole
): Promise<AppJwtPayload> {
  const token = getTokenFromRequest(req);
  if (!token) {
    throw new AuthError('Authentication required', 401);
  }

  const payload = await verifyJwt(token);
  const payloadRole = payload.role ?? 'user';

  if (ROLE_PRIORITY[payloadRole] < ROLE_PRIORITY[role]) {
    throw new AuthError('Forbidden', 403);
  }

  return payload;
}
