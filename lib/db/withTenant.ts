import { drizzle } from "drizzle-orm/postgres-js";
import { client } from "./drizzle";
import * as schema from "./schema";
import { getCurrentUserId } from "@/lib/tenant";

export async function withTenant<T>(
  tenantId: string,
  fn: (dbScoped: ReturnType<typeof drizzle<typeof schema>>) => Promise<T>
) {
  const userId = await getCurrentUserId();
  return client.begin(async (sql) => {
    await sql`select set_config('app.tenant_id', ${tenantId}, true)`;
    if (userId) {
      await sql`select set_config('app.user_id', ${userId}, true)`;
    }
    try {
      const dbScoped = drizzle(sql, { schema });
      return await fn(dbScoped);
    } finally {
      await sql`select set_config('app.tenant_id', null, true)`;
      if (userId) {
        await sql`select set_config('app.user_id', null, true)`;
      }
    }
  });
}
