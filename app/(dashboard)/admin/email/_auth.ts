"use server";

import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AuthError, requireRole } from '@/lib/auth/jwt';

export type SuperAdminContext = Awaited<ReturnType<typeof requireRole>>;

async function buildAuthRequest(): Promise<Request> {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const authToken = cookieStore.get('auth_token')?.value;
  const authorization = headerStore.get('authorization') ?? undefined;

  const headerEntries: [string, string][] = [];

  if (authToken) {
    headerEntries.push(['cookie', `auth_token=${authToken}`]);
  }

  if (authorization) {
    headerEntries.push(['authorization', authorization]);
  }

  return new Request('https://internal.deelrxcrm/admin/email', {
    headers: new Headers(headerEntries),
  });
}

export async function requireSuperAdmin(): Promise<SuperAdminContext> {
  const request = await buildAuthRequest();

  try {
    return await requireRole(request, 'superAdmin');
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.status === 401) {
        redirect('/sign-in');
      }

      redirect('/dashboard');
    }

    throw error;
  }
}
