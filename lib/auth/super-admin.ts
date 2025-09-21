import { getUser } from '../db/queries';

/**
 * Check if the current user is a super admin
 * Super admins are defined by email in the SUPER_ADMIN_EMAILS environment variable
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const user = await getUser();
    if (!user?.email) return false;

    const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map(email => email.trim());
    return superAdminEmails.includes(user.email);
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
}

/**
 * Check if a specific email is a super admin
 */
export function isEmailSuperAdmin(email: string): boolean {
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map(e => e.trim());
  return superAdminEmails.includes(email);
}

/**
 * Require super admin access - throws error if not authorized
 */
export async function requireSuperAdmin(): Promise<void> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    throw new Error('Super admin access required');
  }
}