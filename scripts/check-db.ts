import postgres from 'postgres';

/**
 * Main function to connect to the database and retrieve schema information.
 *
 * This function checks for the presence of a database URL, establishes a connection using the postgres library,
 * and executes SQL queries to check for the existence of specific tables and their column types.
 * It logs the results to the console and ensures the database connection is closed properly in a finally block.
 */
async function main() {
  const url = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!url) {
    console.error('Missing DATABASE_URL/DATABASE_URL_UNPOOLED');
    process.exit(1);
  }
  const sql = postgres(url, { ssl: 'require', max: 1 });
  try {
    const regs = await sql`
      SELECT
        to_regclass('public.tenants')  AS tenants,
        to_regclass('public.tenant_members') AS tenant_members,
        to_regclass('public.user_settings') AS user_settings,
        to_regclass('public.audit_log') AS audit_log,
        to_regclass('public.users') AS users,
        to_regclass('public.teams') AS teams,
        to_regclass('public.team_members') AS team_members
    `;
    console.log('Table presence:', regs[0]);
    const [{ count }] = await sql`SELECT count(*)::int AS count FROM tenants`;
    console.log('Tenants count:', count);

    const cols = await sql`
      select table_name, column_name, data_type
      from information_schema.columns
      where table_schema = 'public'
        and table_name in ('tenants','tenant_members','user_settings','audit_log')
      order by table_name, ordinal_position
    `;
    console.log('Column types:', cols);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
