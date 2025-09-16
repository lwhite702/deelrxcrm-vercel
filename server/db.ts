import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';

import { env, requireEnv } from './config/env';
import * as schema from './db/schema';

export type Database = NeonHttpDatabase<typeof schema>;

function ensureSslMode(url: string): string {
  if (url.toLowerCase().includes('sslmode=')) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}sslmode=require`;
}

export function getDb(): Database {
  const rawUrl = env.databaseUrl ?? requireEnv('DATABASE_URL');
  const connectionString = ensureSslMode(rawUrl);
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}
