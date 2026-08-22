import "server-only";
import { redirect } from "next/navigation";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Identity, Membership, Role, Tenant } from "@/lib/generated/prisma/client";
import { emit } from "@/lib/audit";

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
 * The active tenant lives in the server session and is never accepted from the
 * client — not from a header, a query parameter, a browser-readable cookie, or
 * the subdomain. The subdomain selects the trade layer and carries no
 * authority.
 *
 * STEP 4 of docs/tenancy-model.md replaces the resolution below with a real
 * server-session read plus a tenant switcher. Until then this handles only the
 * unambiguous case and REFUSES to guess:
 *
 *   no active membership -> redirect; there is nothing to show
 *   exactly one          -> that tenant
 *   more than one        -> throws, because picking one would be a guess, and
 *                           a guessed tenant is a cross-tenant read
 */
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

  if (ctx.memberships.length > 1) {
    throw new Error(
      "Multiple active memberships and no session tenant selection. " +
        "Tenant switching is step 4 of docs/tenancy-model.md; refusing to guess a tenant.",
    );
  }

  const membership = ctx.memberships[0];

  return {
    ...ctx,
    tenant: membership.tenant,
    membership,
    role: membership.role,
  };
}
