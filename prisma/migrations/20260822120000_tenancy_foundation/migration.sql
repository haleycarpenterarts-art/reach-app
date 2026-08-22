-- Tenancy foundation
--
-- Replaces Profile + the Role enum with Tenant / Identity / Membership / roles.
-- See docs/tenancy-model.md and DECISIONS.md 2026-08-22.
--
-- DATA: non-destructive to people. Existing profiles become identities, keeping
-- id, email, fullName and timestamps. profiles.role is NOT carried over — role
-- now lives on a membership, and there is no tenant to attach one to until
-- provisioning runs. Audit rows keep their actor and gain a denormalised copy
-- of that actor's email and name before profiles is dropped.
--
-- ENFORCEMENT: policies are created here; they are NOT yet in force. The
-- Prisma connection currently uses a role that bypasses RLS, and this migration
-- deliberately does not FORCE row level security, because doing so before the
-- app sets tenant context per request would return zero rows for every query.
-- Creating the non-superuser app role, setting context per request, and
-- FORCE ROW LEVEL SECURITY are step 3 of docs/tenancy-model.md. Until that
-- lands, tenant isolation is NOT enforced — do not treat this migration as
-- having delivered it.

-- ---------------------------------------------------------------
-- Session context
--
-- Policies read the current tenant and identity from session GUCs rather than
-- Supabase's auth.uid(), because Prisma connects directly to Postgres and
-- never passes through PostgREST. Both return NULL when unset, which fails
-- every policy closed — deny-by-default (CLAUDE.md rule 4).
-- ---------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_tenant_id() RETURNS uuid
  LANGUAGE sql STABLE
  AS $$ SELECT nullif(current_setting('app.tenant_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION app.current_identity_id() RETURNS uuid
  LANGUAGE sql STABLE
  AS $$ SELECT nullif(current_setting('app.identity_id', true), '')::uuid $$;

-- ---------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------
CREATE TYPE "Trade" AS ENUM ('AV', 'LOW_VOLTAGE', 'SECURITY', 'ELECTRICAL');
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "IdentityStatus" AS ENUM ('ACTIVE', 'DEACTIVATED');
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');

ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'TENANT_SWITCHED';
ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'MEMBERSHIP_INVITED';
ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'MEMBERSHIP_ACTIVATED';
ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'MEMBERSHIP_SUSPENDED';
ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'MEMBERSHIP_ROLE_CHANGED';
ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'IDENTITY_DEACTIVATED';
ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'TENANT_TRADE_ENABLED';
ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'TENANT_TRADE_DISABLED';

-- ---------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

CREATE TABLE "tenant_trades" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "trade" "Trade" NOT NULL,
    "enabledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_trades_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_trades_tenantId_trade_key" ON "tenant_trades"("tenantId", "trade");

CREATE TABLE "identities" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "status" "IdentityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identities_pkey" PRIMARY KEY ("id")
);

-- The only global uniqueness constraint in the schema. Everything else is
-- scoped to a tenant.
CREATE UNIQUE INDEX "identities_email_key" ON "identities"("email");

CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "roles_tenantId_code_key" ON "roles"("tenantId", "code");

CREATE TABLE "memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "identityId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "memberships_tenantId_identityId_key" ON "memberships"("tenantId", "identityId");
CREATE INDEX "memberships_identityId_status_idx" ON "memberships"("identityId", "status");
CREATE INDEX "memberships_tenantId_status_idx" ON "memberships"("tenantId", "status");

ALTER TABLE "tenant_trades" ADD CONSTRAINT "tenant_trades_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "roles" ADD CONSTRAINT "roles_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RESTRICT, not SET NULL and not CASCADE: an identity is never deleted, and a
-- role in use cannot be removed out from under a membership.
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_identityId_fkey"
  FOREIGN KEY ("identityId") REFERENCES "identities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "memberships" ADD CONSTRAINT "memberships_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------
-- Carry the people across
-- ---------------------------------------------------------------
INSERT INTO "identities" ("id", "email", "fullName", "status", "createdAt", "updatedAt")
SELECT "id", "email", "fullName", 'ACTIVE', "createdAt", "updatedAt"
FROM "profiles"
ON CONFLICT ("id") DO NOTHING;

-- ---------------------------------------------------------------
-- audit_events: tenant scope, and authorship that survives a departure
-- ---------------------------------------------------------------
-- IF EXISTS: the constraint is already dropped on the fix/audit-emit branch.
ALTER TABLE "audit_events" DROP CONSTRAINT IF EXISTS "audit_events_actorId_fkey";

ALTER TABLE "audit_events" ADD COLUMN "tenantId" UUID;
ALTER TABLE "audit_events" ADD COLUMN "actorEmail" TEXT;
ALTER TABLE "audit_events" ADD COLUMN "actorName" TEXT;

-- Denormalise the actor before profiles goes away. From here on the emitter
-- writes these at emit time.
UPDATE "audit_events" a
SET "actorEmail" = p."email",
    "actorName"  = p."fullName"
FROM "profiles" p
WHERE a."actorId" = p."id";

CREATE INDEX "audit_events_tenantId_occurredAt_idx" ON "audit_events"("tenantId", "occurredAt");

-- RESTRICT: a tenant with audit history cannot be deleted. Removing the
-- record of what happened is not a supported operation.
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Append-only, enforced at the database rather than by convention.
-- CLAUDE.md rule 8 and Principle 9: what was recorded cannot change.
--
-- This blocks UPDATE and DELETE for every role, including the service role
-- and the table owner. Retention pruning, if it is ever wanted, is a
-- deliberate maintenance operation that must drop this trigger under audit —
-- it is not something application code can reach.
CREATE OR REPLACE FUNCTION app.audit_events_append_only() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only: % is not permitted', TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER audit_events_append_only
  BEFORE UPDATE OR DELETE ON "audit_events"
  FOR EACH ROW EXECUTE FUNCTION app.audit_events_append_only();

-- ---------------------------------------------------------------
-- Retire the old shape
-- ---------------------------------------------------------------
DROP TABLE "profiles";
DROP TYPE "Role";

-- ---------------------------------------------------------------
-- Row level security
--
-- Every table gets a policy here (CLAUDE.md rule 10). Reads are scoped to the
-- session tenant. There are deliberately NO insert, update or delete policies:
-- deny-by-default, with writes flowing through the service role until
-- lib/authz/ resolves from the active membership (step 5).
--
-- Policies scope on the session tenant, NEVER on the subdomain. The subdomain
-- selects the trade layer and carries no authority.
-- ---------------------------------------------------------------
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_trades" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "identities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_read_own" ON "tenants"
  FOR SELECT USING ("id" = app.current_tenant_id());

CREATE POLICY "tenant_trades_read_own" ON "tenant_trades"
  FOR SELECT USING ("tenantId" = app.current_tenant_id());

-- Yourself, plus anyone you share the active tenant with. Without the second
-- clause a tenant could not render its own user list; with anything broader,
-- one tenant could enumerate another's people.
CREATE POLICY "identities_read_self_or_tenant_peer" ON "identities"
  FOR SELECT USING (
    "id" = app.current_identity_id()
    OR EXISTS (
      SELECT 1 FROM "memberships" m
      WHERE m."identityId" = "identities"."id"
        AND m."tenantId" = app.current_tenant_id()
    )
  );

-- The second clause is what makes a tenant switcher possible: before a tenant
-- is chosen, current_tenant_id() is NULL and you can still see your own
-- memberships.
CREATE POLICY "memberships_read_tenant_or_own" ON "memberships"
  FOR SELECT USING (
    "tenantId" = app.current_tenant_id()
    OR "identityId" = app.current_identity_id()
  );

CREATE POLICY "roles_read_tenant_or_own_membership" ON "roles"
  FOR SELECT USING (
    "tenantId" = app.current_tenant_id()
    OR EXISTS (
      SELECT 1 FROM "memberships" m
      WHERE m."roleId" = "roles"."id"
        AND m."identityId" = app.current_identity_id()
    )
  );

-- Null-tenant rows — sign-in failures and other pre-tenant platform events —
-- match no tenant and are reachable only by the service role. That is
-- intended: they are platform records, not tenant records.
CREATE POLICY "audit_events_read_tenant" ON "audit_events"
  FOR SELECT USING ("tenantId" = app.current_tenant_id());
