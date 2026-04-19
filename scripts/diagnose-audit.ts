/**
 * Diagnostic: reproduce what lib/audit does, against prod DATABASE_URL,
 * from a local Node process. Helps isolate whether the silent audit
 * failure is a Prisma-runtime issue or a Vercel-specific issue.
 */
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Attempting insert via Prisma...");
    const event = await prisma.auditEvent.create({
      data: {
        type: "SIGN_IN",
        actorId: "cae670b3-1f02-43f7-9802-85b2aea38792",
        metadata: { source: "diagnostic-script" },
      },
    });
    console.log("✓ Insert OK:", event);

    const count = await prisma.auditEvent.count();
    console.log(`Total rows: ${count}`);
  } catch (err) {
    console.error("✗ Prisma insert FAILED:");
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
