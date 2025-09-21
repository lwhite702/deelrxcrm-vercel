import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    // Prefer unpooled Neon host for WebSocket driver compatibility
    url:
      (process.env.DATABASE_URL_UNPOOLED ||
        process.env.POSTGRES_URL ||
        process.env.DATABASE_URL) ??
      "",
  },
});
