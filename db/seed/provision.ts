import type { PrismaClient, Trade } from "@/lib/generated/prisma/client";
import { AV_ROLE_SEED } from "./roles";

/**
 * Provision a tenant: the business, its enabled trade layers, and its seeded
 * role set.
 *
 * The enabled-trades list is provisioning-time state. There is no billing
 * subsystem in v1, and no tenant-facing way to change it — see DECISIONS.md
 * 2026-08-22 and docs/rbac-matrix.md §1a.
 *
 * Idempotent: safe to re-run for the same slug. It will not remove a trade or
 * a role that already exists, because removing either could orphan a
 * membership or revoke access as a side effect of running a script.
 */
export async function provisionTenant(
  prisma: PrismaClient,
  input: { name: string; slug: string; trades: Trade[] },
) {
  const tenant = await prisma.tenant.upsert({
    where: { slug: input.slug },
    update: { name: input.name },
    create: { name: input.name, slug: input.slug },
  });

  for (const trade of input.trades) {
    await prisma.tenantTrade.upsert({
      where: { tenantId_trade: { tenantId: tenant.id, trade } },
      update: {},
      create: { tenantId: tenant.id, trade },
    });
  }

  for (const role of AV_ROLE_SEED) {
    await prisma.role.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: role.code } },
      update: {},
      create: { tenantId: tenant.id, code: role.code, name: role.name, isSystem: true },
    });
  }

  return tenant;
}
