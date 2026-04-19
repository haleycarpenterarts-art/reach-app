import "server-only";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Singleton prevents hot-reload from spawning extra clients in dev.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildPrisma(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? buildPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
