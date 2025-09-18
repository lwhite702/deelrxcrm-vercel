import { getDb } from './db';
import { tenants, userSettings } from '../server/db/schema';
import { eq } from 'drizzle-orm';

// Ensures a personal tenant exists for the given user. Idempotent.
export async function ensurePersonalTenant(userId: string, userName?: string) {
  const db = getDb();
  // check user_settings
  const existing = await db.query.userSettings.findFirst({ where: (us, { eq }) => eq(us.userId, userId) });
  if (existing && existing.personalTenantId) return existing.personalTenantId;

  // create tenant + settings in a best-effort sequence (no transaction in serverless neon-http)
  const slugBase = (userName || userId).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'me';
  const slug = slugBase + '-' + userId.slice(0, 6);
  const [tenant] = await db.insert(tenants).values({ slug, name: userName || 'Personal Workspace', personal: true }).returning();
  await db.insert(userSettings).values({ userId, personalTenantId: tenant.id }).onConflictDoNothing();
  return tenant.id;
}
