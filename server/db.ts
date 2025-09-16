import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import { env, requireEnv } from "./config/env";
import * as schema from "./db/schema";

export type Database = NeonHttpDatabase<typeof schema>;

/**
 * Ensures that the provided URL has the SSL mode set to 'require'.
 *
 * This function checks if the URL already contains an 'sslmode' parameter.
 * If it does, it updates the value to 'require' if it's not already set.
 * If the parameter is absent, it appends 'sslmode=require' to the URL,
 * using the appropriate separator based on the presence of a query string.
 *
 * @param {string} url - The URL to be modified to ensure SSL mode.
 */
function ensureSslMode(url: string): string {
  if (url.toLowerCase().includes("sslmode=")) {
    if (url.toLowerCase().includes("sslmode=require")) {
      return url;
    }
    return url.replace(/sslmode=[^&]*/i, "sslmode=require");
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}sslmode=require`;
}

/**
 * Retrieves a Database instance using the configured database URL.
 */
export function getDb(): Database {
  const rawUrl = env.databaseUrl ?? requireEnv("DATABASE_URL");
  const connectionString = ensureSslMode(rawUrl);
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}
