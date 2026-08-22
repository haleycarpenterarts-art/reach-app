import "server-only";
import { withIdentity } from "@/lib/prisma";
import { emit } from "@/lib/audit";
import type { Trade } from "@/lib/generated/prisma/enums";

/**
 * The active tenant: reading it, and changing it.
 *
 * The active tenant is NEVER accepted from the client. It is stored server-side
 * in active_tenant_selections and re-validated against an ACTIVE membership on
 * every read, so revoking a membership takes effect on the next request rather
 * than whenever the stored row is tidied up.
 *
 * Switching is a REQUEST to change, not an instruction: setActiveTenant checks
 * the membership exists and is active before it stores anything, and refuses
 * otherwise. A caller passing an arbitrary tenant id gets a refusal, not a
 * switch. See docs/tenancy-model.md and DECISIONS.md 2026-08-22.
 */

export type MembershipSummary = {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  roleCode: string;
  roleName: string;
  enabledTrades: Trade[];
};

/** Every tenant this identity can currently work in. */
export async function listMemberships(identityId: string): Promise<MembershipSummary[]> {
  return withIdentity(identityId, async (tx) => {
    const rows = await tx.membership.findMany({
      where: { identityId, status: "ACTIVE" },
      include: { tenant: { include: { trades: true } }, role: true },
      orderBy: { activatedAt: "asc" },
    });

    return rows
      .filter((m) => m.tenant.status === "ACTIVE")
      .map((m) => ({
        tenantId: m.tenantId,
        tenantName: m.tenant.name,
        tenantSlug: m.tenant.slug,
        roleCode: m.role.code,
        roleName: m.role.name,
        enabledTrades: m.tenant.trades.map((t) => t.trade),
      }));
  });
}

/**
 * The stored selection, re-validated.
 *
 * Returns null when there is no selection, when the stored one no longer
 * corresponds to an active membership, or when the identity has no memberships
 * at all. Null is a legitimate state — it means "ask which tenant", not "error".
 *
 * A single membership auto-selects. That is a convenience, not an assumption:
 * with exactly one option there is nothing to guess between. With more than
 * one, this returns null rather than picking, because picking would be a guess
 * and a guessed tenant is a cross-tenant read.
 */
export async function getActiveTenant(
  identityId: string,
): Promise<MembershipSummary | null> {
  const memberships = await listMemberships(identityId);
  if (memberships.length === 0) return null;

  const stored = await withIdentity(identityId, (tx) =>
    tx.activeTenantSelection.findUnique({ where: { identityId } }),
  );

  if (stored) {
    const match = memberships.find((m) => m.tenantId === stored.tenantId);
    // No match means the membership was revoked or the tenant suspended since
    // the selection was made. Fall through rather than trusting the row.
    if (match) return match;
  }

  if (memberships.length === 1) {
    await persist(identityId, memberships[0].tenantId);
    return memberships[0];
  }

  return null;
}

export class TenantSwitchRefused extends Error {
  constructor(public readonly tenantId: string) {
    super("No active membership for the requested tenant.");
    this.name = "TenantSwitchRefused";
  }
}

/**
 * Switch the active tenant, re-deriving permissions server-side.
 *
 * Throws TenantSwitchRefused if the identity has no active membership in the
 * requested tenant. The check is the whole point — this is the one entry point
 * where a tenant id arrives from outside, so it is the one place that must
 * refuse rather than trust.
 */
export async function setActiveTenant(
  identityId: string,
  tenantId: string,
): Promise<MembershipSummary> {
  const memberships = await listMemberships(identityId);
  const target = memberships.find((m) => m.tenantId === tenantId);

  if (!target) {
    await emit({
      type: "AUTHZ_DENIED",
      actorId: identityId,
      metadata: { reason: "tenant_switch_refused", requestedTenantId: tenantId },
    });
    throw new TenantSwitchRefused(tenantId);
  }

  const previous = await withIdentity(identityId, (tx) =>
    tx.activeTenantSelection.findUnique({ where: { identityId } }),
  );

  await persist(identityId, tenantId);

  await emit({
    type: "TENANT_SWITCHED",
    tenantId,
    actorId: identityId,
    metadata: { fromTenantId: previous?.tenantId ?? null, toTenantId: tenantId },
  });

  return target;
}

async function persist(identityId: string, tenantId: string): Promise<void> {
  await withIdentity(identityId, (tx) =>
    tx.activeTenantSelection.upsert({
      where: { identityId },
      update: { tenantId, selectedAt: new Date() },
      create: { identityId, tenantId },
    }),
  );
}
