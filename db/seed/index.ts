import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { provisionTenant } from "./provision";

// tsx does not load .env files. Same convention as scripts/backup.ts:
// .env.local takes precedence so local overrides work without editing .env.
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

/**
 * Development seed.
 *
 * Per CLAUDE.md: development data is synthetic, obviously synthetic, and never
 * modelled on a real account. These two tenants exist so the multi-tenant and
 * multi-trade cases are exercised from day one rather than discovered later:
 *
 *   northwind-av      single trade  — the ordinary case
 *   contoso-trades    three trades  — one business running AV, low voltage and
 *                                     security under one roof, sharing one
 *                                     dataset. First-class, not an edge case.
 *
 * Refuses to run against production. No identities and no memberships are
 * created here — those come from a real sign-up plus an invite.
 */
async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed: NODE_ENV is production.");
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Without this the adapter silently falls back to localhost and fails
    // with ECONNREFUSED, which reads like a database problem rather than a
    // missing variable.
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const northwind = await provisionTenant(prisma, {
      name: "Northwind AV (sample)",
      slug: "northwind-av",
      trades: ["AV"],
    });

    const contoso = await provisionTenant(prisma, {
      name: "Contoso Trades (sample)",
      slug: "contoso-trades",
      trades: ["AV", "LOW_VOLTAGE", "SECURITY"],
    });

    console.log(`Seeded tenants: ${northwind.slug}, ${contoso.slug}`);
    console.log("No identities or memberships seeded — sign up, then invite.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
