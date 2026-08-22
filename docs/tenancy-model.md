# Tenancy, identity and trade layers

The model everything else is built on. Settled 2026-08-22 — see `DECISIONS.md`,
*Tenancy and identity* and *Trade layers*.

This document is the plan the schema work executes. It supersedes the `Profile` +
`Role` enum shape in `prisma/schema.prisma`, which predates the multi-tenant framing.

---

## The three axes, and why they are independent

Keeping these apart is the whole design. Collapsing any two is how the model fails.

| Axis | What it is | Where it comes from | What it may decide |
|---|---|---|---|
| **Identity** | A human | Supabase auth session | Who you are. Nothing else. |
| **Tenant** | A business | **Server session only** | What data exists. All of it. |
| **Trade layer** | AV, low voltage, security… | Subdomain | Which vocabulary, workflow and screens are active |

**A tenant is a business, not a business-and-trade pairing.** One dataset per
business. A business running AV, low voltage and security under one roof is one
tenant with three trades enabled — a first-class case, not an edge case. Its
customer record is shared across all three, because there is one dataset and the
trade is a layer over it.

**The subdomain never selects the tenant and never scopes the data.** It is
client-supplied. A design where the URL determines whose rows come back is one
crafted request away from a cross-tenant read.

---

## Identity and membership

```
Identity ──< Membership >── Tenant
                 │
                 └── role → tenant-scoped Role
```

**`Identity`** — one row per human, platform-wide. 1:1 with the Supabase auth user.
Email is unique **globally**, and this is the only global uniqueness constraint in
the schema. Carries no role, no tenant, no permissions. Never deleted — deactivated,
so audit authorship survives.

**`Membership`** — one row per (identity, tenant). Carries the **role**, the
membership state (invited / active / suspended), and the timestamps. The same person
holds different roles in different businesses, which is why role cannot live on the
identity.

**`Tenant`** — one row per business. Carries the **enabled-trades list** and
provisioning metadata.

**`Role`** — a tenant-scoped table, seeded per tenant from `docs/rbac-matrix.md`.
**Not a Postgres enum.** The layer model puts roles and permissions in the tenant
layer: *configuration, no code*. A tenant renaming a role or adding one must not
require a migration and a deploy.

The twelve AV role codes remain correct as the **AV trade layer's seeded defaults**.
What changes is the expression, not the content.

### What this replaces

| Now | Becomes |
|---|---|
| `Profile` (id, email unique, role enum) | `Identity` (id, email unique globally) + `Membership` (identity, tenant, role) |
| `Role` Postgres enum, 12 values | `roles` table, tenant-scoped, seeded from the matrix |
| `audit_events.actorId → Profile` with `SetNull` | actor binds to `Identity`, which is never deleted; actor email and display name denormalised onto the row at write time |

---

## Trade layers

`reach-systems.app` is the platform. `av.reach-systems.app`, `elec.reach-systems.app`
and so on select the **active trade layer** — the vocabulary, workflows, document
types and screens of that trade, over the tenant's one dataset.

### Entitlement nests, and both checks run

1. **Tenant level** — the tenant's enabled-trades list, set at provisioning. A
   tenant that does not have low voltage has no low-voltage anything, for anyone.
2. **Role level** — trade access is a **permission in the existing admin-editable
   RBAC matrix**, granted per role at `/admin/roles`. The admin UI only offers
   trades the tenant actually has.

The runtime check consults **both**. Either failing is a plain deny-by-default
authorization failure — same path, same `AUTHZ_DENIED` audit event as any other.

Trade access is not a new mechanism. The matrix already versions every change,
emits an audit diff, and requires step-up auth to weaken a restriction
(`DECISIONS.md` 2026-04-17). A parallel entitlement system would be a second place
a fact can live — Principle 4.

**No billing subsystem in v1.** The enabled-trades list is provisioning-time state.
How entitlement relates to billing is deferred, not answered.

---

## Session rules

These are the rules a cross-tenant leak would have to get past. Treat them as
trusted-core.

- **Cookie scoped to `.reach-systems.app`** so one login spans every subdomain.
  `Secure`, `HttpOnly`, `SameSite=Lax`.
- **Active tenant lives in the server session and is never accepted from the
  client.** Not from a header, not from a query parameter, not from a cookie the
  browser can read, not from the subdomain.
- **Switching tenant re-derives permissions server-side** and emits an audit event.
  It never trusts a client-sent tenant id — the switch is a request to change, and
  the server decides whether that membership exists and is active.
- **Trade layer and tenant resolve independently.** Middleware reads the trade from
  the subdomain and the tenant from the session. Neither derives from the other.
- **RLS policies scope on the session tenant, never on the subdomain.**

### Invite flow must not enumerate

With one global identity, an invite endpoint that responds differently for a known
email tells an attacker which businesses use Reach and who works there.

**Identical response either way** — same status code, same body, same visible copy,
same timing envelope. The only difference is which email is sent, and only the
mailbox owner learns it:

| Case | Response | Email sent |
|---|---|---|
| No identity exists | Success | Create your account and join |
| Identity exists, not a member | Success | Sign in to join |
| Identity exists, already a member | Success | You already have access |

The same rule applies to sign-up, password reset, and anywhere else an email address
is submitted.

---

## Build order

Each step is the foundation of the next.

1. **`Tenant`, `Identity`, `Membership`, `roles`.** Replaces `Profile` and the
   `Role` enum. One migration — the current schema is 96 lines and two models, and
   this is the cheapest this change will ever be.
2. **`tenant_id` and an RLS policy on every table**, including `audit_events`. The
   policy pattern is established here once and every later table follows it. A table
   without a policy is a defect, not an increment (`CLAUDE.md` rule 10).
3. **Prisma connects as a non-superuser role** and sets tenant context per request.
   Prisma's pooled role bypasses RLS by default, so without this the policies are
   decorative (`DECISIONS.md` 2026-08-22, *Tenancy enforcement*).
4. **Session and middleware** — cookie scope, server-held active tenant, subdomain
   to trade resolution, tenant switching.
5. **`lib/authz/` resolves from the active membership**, not a profile column, and
   the trade-access check consults tenant enabled-trades plus role grant.
6. **Seed and matrix** — `docs/rbac-matrix.md` gains the trade-access permission;
   `db/seed/rbac.ts` seeds roles per tenant rather than globally.

## Verification, and what does not count

Reading an RLS policy is not verifying isolation. Each of these is checked by
querying as the other party:

- A member of tenant A, authenticated, cannot read a single row belonging to tenant
  B — through the app, and directly through the Prisma connection role.
- A member whose tenant lacks a trade gets denied at `av.` regardless of role.
- A member whose role lacks the trade permission gets denied even where the tenant
  has that trade enabled.
- Switching tenant changes the permission set with no client-supplied input.
- The invite endpoint returns byte-identical responses for a known and an unknown
  email.
- Deactivating a member leaves every audit event they produced still attributed.

## Open

- **Cross-tenant identity UX.** Someone who belongs to two businesses needs a tenant
  switcher and a sensible landing behaviour. Mechanism is decided; the interface is
  not.
- **Trade layer for a tenant with one trade.** Whether `av.` is mandatory or whether
  the bare platform domain resolves to a single-trade tenant's only trade. Convenience
  question, no security consequence.
- **Entitlement and billing.** Deferred with v1's no-billing decision. The
  enabled-trades list is the seam it will attach to.
