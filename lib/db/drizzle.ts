import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('POSTGRES_URL or DATABASE_URL environment variable is not set');
}

export const client = postgres(dbUrl);
export const db = drizzle(client, { schema });
