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

/**
 * Privileged client. Connects as the owning role, which carries BYPASSRLS, so
 * queries made directly on this client are NOT tenant-isolated.
 *
 * Use it only for genuinely platform-level work: resolving an identity before
 * any tenant is known, emitting audit events, provisioning, migrations, seeds.
 * Anything that touches tenant data goes through withTenant().
 */
export const prisma = globalForPrisma.prisma ?? buildPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * The transaction-scoped client handed to a withTenant callback.
 *
 * Spelled out rather than imported: Prisma 7 no longer exports the deny-list
 * type, and depending on an internal name breaks silently on upgrade.
 */
export type TenantClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Run tenant-scoped work with row-level security actually in force.
 *
 * Opens a transaction, drops into the unprivileged `app_user` role, and sets
 * the tenant and identity the policies read. All three are transaction-local,
 * so a pooled connection returns to its normal role and an empty context on
 * commit or rollback — a leaked context cannot outlive the request.
 *
 * Inside the callback, a query for another tenant's rows returns nothing. Not
 * because the query was written carefully, but because the database refuses.
 * That is the point: tenant isolation stops depending on application code
 * being correct, which is the one class of failure a multi-tenant product does
 * not survive. See DECISIONS.md 2026-08-22 — Tenancy enforcement.
 *
 * The tenant id must come from the SERVER SESSION. Never pass one derived from
 * a header, a query parameter, a browser-readable cookie, or the subdomain.
 *
 * WHAT THIS DOES NOT DEFEND AGAINST. The privilege drop is not one-way.
 * SET ROLE is authorised against the SESSION user's memberships, and the
 * session user remains the owner, so code that can issue raw SQL inside the
 * callback can switch back and see everything. Verified, not assumed.
 *
 * So this defends against the failure that actually happens — a query missing
 * its tenant filter — and not against deliberate escalation by code already
 * running in the server process. Closing that gap needs a separate LOGIN role
 * with no membership in the owner, which costs a managed credential in every
 * environment. Recorded in DECISIONS.md 2026-08-22 as the deferred option, to
 * be taken before there is a second real tenant.
 */
export async function withTenant<T>(
  ctx: { tenantId: string; identityId: string },
  fn: (tx: TenantClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // set_config(..., true) is transaction-local, the same as SET LOCAL.
    // Parameterised: these values must never be interpolated into SQL.
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${ctx.tenantId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.identity_id', ${ctx.identityId}, true)`;
    // Must come last — after the switch this session cannot set_config on
    // behalf of anyone, and cannot switch back.
    await tx.$executeRawUnsafe("SET LOCAL ROLE app_user");
    return fn(tx);
  });
}
