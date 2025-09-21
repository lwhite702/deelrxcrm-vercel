import { readFile } from 'node:fs/promises';
import postgres from 'postgres';

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
