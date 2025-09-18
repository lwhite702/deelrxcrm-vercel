import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../server/db/schema";

// Future: set_config('app.tenant_id', ...) per request for RLS.
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const connection = neon(url.includes("sslmode=") ? url : url + (url.includes("?") ? "&" : "?") + "sslmode=require");
  return drizzle(connection, { schema });
}

// Wrap a callback ensuring tenant context (placeholder until RLS logic implemented)
export async function withTenant<T>(tenantId: string, fn: (db: ReturnType<typeof getDb>) => Promise<T> | T) {
  // TODO: issue a `select set_config('app.tenant_id', $1, true)` once using a pg client that supports it.
  const db = getDb();
  return fn(db);
}
