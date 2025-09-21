import { readFile } from 'node:fs/promises';
import postgres from 'postgres';

/**
 * Executes the main migration process for the database.
 *
 * This function retrieves the database connection URL from environment variables, ensuring that either DATABASE_URL or DATABASE_URL_UNPOOLED is provided. It then reads a SQL migration file and applies it to the database using a secure connection. Finally, it ensures that the database connection is properly closed after the operation, regardless of success or failure.
 */
async function main() {
  const url = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!url) {
    console.error('Missing DATABASE_URL or DATABASE_URL_UNPOOLED');
    process.exit(1);
  }
  const sql = postgres(url, { ssl: 'require', max: 1 });
  try {
    const migration = await readFile('./drizzle/0001_multitenancy.sql', 'utf8');
    await sql.unsafe(migration);
    console.log('Applied root migration successfully.');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
