import "server-only";
import { redirect } from "next/navigation";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Identity, Membership, Role, Tenant } from "@/lib/generated/prisma/client";
import { emit } from "@/lib/audit";
import { getActiveTenant } from "@/lib/tenancy/active-tenant";

export type ActiveMembership = Membership & {
  tenant: Tenant;
  role: Role;
};

export type AuthedContext = {
  identityId: string;
  email: string;
  identity: Identity;
  /** Active memberships only. Empty for someone with no tenant yet. */
  memberships: ActiveMembership[];
};

export type TenantContext = AuthedContext & {
  tenant: Tenant;
  membership: ActiveMembership;
  role: Role;
};

/**
 * Server-side auth gate for protected routes.
 *
 * Resolves WHO, and nothing else. Identity is global — it carries no role, no
 * tenant and no permissions, because the same person holds different roles in
 * different businesses. See docs/tenancy-model.md.
 *
 * - Redirects to /sign-in if no session exists.
 * - Upserts an Identity row on first authenticated access. No role is assigned
 *   here; role lives on a membership.
 * - Emits AUTHZ_DENIED only for attempted-access-without-session cases that
 *   bypass middleware (defence in depth).
 *
 * Deny-by-default per CLAUDE.md rule 4: callers use this at the top of every
 * protected server component / server action, and requireTenant() wherever
 * tenant-scoped data is touched.
 */
export async function requireAuth(): Promise<AuthedContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Middleware should catch this first; if we got here, emit and redirect.
    await emit({ type: "AUTHZ_DENIED", metadata: { reason: "no_session" } });
    redirect("/sign-in");
  }

  const email = user.email ?? "";

  const identity = await prisma.identity.upsert({
    where: { id: user.id },
    update: { email },
    create: { id: user.id, email },
  });

  if (identity.status === "DEACTIVATED") {
    await emit({
      type: "AUTHZ_DENIED",
      actorId: identity.id,
      actorEmail: identity.email,
      actorName: identity.fullName,
      metadata: { reason: "identity_deactivated" },
    });
    redirect("/sign-in");
  }

  const memberships = await prisma.membership.findMany({
    where: { identityId: identity.id, status: "ACTIVE" },
    include: { tenant: true, role: true },
    orderBy: { activatedAt: "asc" },
  });

  return {
    identityId: identity.id,
    email,
    identity,
    memberships: memberships.filter((m) => m.tenant.status === "ACTIVE"),
  };
}

/**
 * Resolves the ACTIVE TENANT for tenant-scoped work.
 *
 * The active tenant comes from the server-side selection in
 * active_tenant_selections, re-validated against a live ACTIVE membership on
 * every call. It is never accepted from the client — not from a header, a
 * query parameter, a browser-readable cookie, or the subdomain. The subdomain
 * selects the trade layer and carries no authority.
 *
 *   no active membership          -> redirect; there is nothing to show
 *   one, or a valid stored choice -> that tenant
 *   several and nothing chosen    -> throws TenantSelectionRequired
 *
 * The last case is not an error condition, it is an unanswered question. It
 * throws rather than picking because picking would be a guess, and a guessed
 * tenant is a cross-tenant read. A tenant switcher answers it; until that UI
 * exists, callers that can hit this must handle it.
 */
export class TenantSelectionRequired extends Error {
  constructor(public readonly choices: { tenantId: string; tenantName: string }[]) {
    super("Several tenants available and none selected.");
    this.name = "TenantSelectionRequired";
  }
}

export async function requireTenant(): Promise<TenantContext> {
  const ctx = await requireAuth();

  if (ctx.memberships.length === 0) {
    await emit({
      type: "AUTHZ_DENIED",
      actorId: ctx.identityId,
      actorEmail: ctx.email,
      metadata: { reason: "no_active_membership" },
    });
    redirect("/sign-in");
  }

  const active = await getActiveTenant(ctx.identityId);

  if (!active) {
    throw new TenantSelectionRequired(
      ctx.memberships.map((m) => ({ tenantId: m.tenantId, tenantName: m.tenant.name })),
    );
  }

  const membership = ctx.memberships.find((m) => m.tenantId === active.tenantId);
  if (!membership) {
    // getActiveTenant validated the membership itself, so this means the two
    // reads disagreed — a revocation landing between them. Deny, do not repair.
    await emit({
      type: "AUTHZ_DENIED",
      actorId: ctx.identityId,
      metadata: { reason: "membership_vanished_mid_request", tenantId: active.tenantId },
    });
    redirect("/sign-in");
  }

  return {
    ...ctx,
    tenant: membership.tenant,
    membership,
    role: membership.role,
  };
}
