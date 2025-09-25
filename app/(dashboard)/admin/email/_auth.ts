"use server";

import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AuthError, requireRole } from '@/lib/auth/jwt';

export type SuperAdminContext = Awaited<ReturnType<typeof requireRole>>;

/**
 * Constructs an authentication request with necessary headers.
 *
 * This asynchronous function retrieves the authentication token from cookies and the authorization header from headers.
 * It then builds an array of header entries, adding the 'cookie' and 'authorization' headers if they are present.
 * Finally, it creates and returns a new Request object targeting a specific URL with the constructed headers.
 */
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

/**
 * Ensures the user has super admin privileges.
 *
 * This function builds an authentication request and attempts to require the 'superAdmin' role.
 * If the role is not granted and an AuthError occurs, it checks the error status.
 * A 401 status redirects the user to the sign-in page, while other statuses redirect to the dashboard.
 */
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
