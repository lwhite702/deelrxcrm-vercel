import postgres from 'postgres';

/**
 * Retrieves the raw user ID from various sources.
 *
 * This function checks the command line arguments for a user ID, followed by checking the environment variable USER_ID.
 * If neither is found, it looks for super admin user IDs in the environment variables NEXT_PUBLIC_SUPER_ADMIN_USER_IDS or SUPER_ADMIN_USER_IDS,
 * returning the first one found after trimming whitespace. If no user ID is available, it returns undefined.
 */
function rawUserId(): string | undefined {
  const arg = process.argv[2];
  if (arg) return arg;
  const envUser = process.env.USER_ID;
  if (envUser) return envUser;
  const superAdmins = process.env.NEXT_PUBLIC_SUPER_ADMIN_USER_IDS || process.env.SUPER_ADMIN_USER_IDS;
  if (superAdmins) return superAdmins.split(',')[0]!.trim();
  return undefined;
}

/**
 * Generates a slug from the given user ID string.
 */
function mkSlug(userIdStr: string): string {
  const suffix = userIdStr.replace(/[^a-zA-Z0-9]/g, '').slice(-8) || 'user';
  return `personal-${suffix.toLowerCase()}`;
}

/**
 * Main function to bootstrap a personal tenant in the database.
 *
 * It retrieves the database URL from environment variables, checks for the presence of user IDs, and determines their types.
 * Depending on the user ID type, it either uses a provided user ID or fetches the first available numeric user ID.
 * The function then ensures the tenant exists, inserts tenant membership, and updates or inserts user settings accordingly.
 * Finally, it logs the bootstrapped tenant information and ensures the SQL connection is closed.
 *
 * @throws Error If the DATABASE_URL or DATABASE_URL_UNPOOLED is missing.
 * @throws Error If no numeric USER_ID is provided and no users are found.
 * @throws Error If a user ID is not provided when needed.
 * @throws Error If fetching tenant ID after insert/select fails.
 */
async function main() {
  const url = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!url) throw new Error('Missing DATABASE_URL or DATABASE_URL_UNPOOLED');

  const sql = postgres(url, { ssl: 'require', max: 1 });
  try {
    // Detect user_id types in tenant_members and user_settings
    const typeRows = await sql<{ table_name: string; data_type: string }[]>`
      select table_name, data_type
      from information_schema.columns
      where table_schema = 'public'
        and table_name in ('tenant_members','user_settings')
        and column_name = 'user_id'
    `;
    const tmType = typeRows.find(r => r.table_name === 'tenant_members')?.data_type || 'text';
    const usType = typeRows.find(r => r.table_name === 'user_settings')?.data_type || 'text';
    const needsNumeric = tmType.includes('integer') || usType.includes('integer');

    let provided = rawUserId();
    let userIdForInsert: number | string | null = null;

    if (needsNumeric) {
      if (provided && /^\d+$/.test(provided)) {
        userIdForInsert = Number(provided);
      } else {
        // Fallback: pick first users.id
        const users = await sql<{ id: number }[]>`select id from users order by id asc limit 1`;
        if (!users[0]) {
          throw new Error('Database expects numeric user_id but no numeric USER_ID provided and no users found. Provide a numeric USER_ID.');
        }
        userIdForInsert = users[0].id;
        provided = String(userIdForInsert);
      }
    } else {
      if (!provided) throw new Error('Provide a user id (arg or USER_ID env).');
      userIdForInsert = provided;
    }

    const slug = mkSlug(String(provided));
    const name = 'Personal Tenant';

    // Ensure tenant exists
    const inserted = await sql<{ id: string }[]>`
      insert into tenants (slug, name, personal)
      select ${slug}, ${name}, true
      where not exists (select 1 from tenants where slug = ${slug})
      returning id
    `;
    let tenantId = inserted[0]?.id;
    if (!tenantId) {
      const existing = await sql<{ id: string }[]>`
        select id from tenants where slug = ${slug} limit 1
      `;
      if (!existing[0]) throw new Error('Failed to fetch tenant id after insert/select');
      tenantId = existing[0].id;
    }

    // Insert tenant membership if not exists (avoid relying on unique constraints)
    await sql`
      insert into tenant_members (tenant_id, user_id, role)
      select ${tenantId}, ${userIdForInsert as any}, 'owner'
      where not exists (
        select 1 from tenant_members where tenant_id = ${tenantId} and user_id = ${userIdForInsert as any}
      )
    `;

    // Upsert user_settings without assuming constraints
    const updated = await sql`update user_settings set personal_tenant_id = ${tenantId} where user_id = ${userIdForInsert as any} returning user_id`;
    if ((updated as any[]).length === 0) {
      try {
        await sql`insert into user_settings (user_id, personal_tenant_id) values (${userIdForInsert as any}, ${tenantId})`;
      } catch (e) {
        // If concurrent insert, ignore
      }
    }

    console.log('Bootstrapped tenant:', { tenantId, slug, userId: userIdForInsert, numericUserIds: needsNumeric });
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
