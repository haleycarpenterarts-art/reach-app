// Prisma CLI config. Loads .env and .env.local (Next.js convention).
// .env.local takes precedence so local overrides work without editing .env.
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma CLI (migrate, db pull/push) uses the Session Pooler — IPv4-safe
    // and supports long-running migration transactions.
    url: process.env.DIRECT_URL,
  },
});
