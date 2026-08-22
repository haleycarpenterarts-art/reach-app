-- Server-held active tenant selection — step 4 of docs/tenancy-model.md
--
-- The active tenant is never accepted from the client. Not from a header, a
-- query parameter, a browser-readable cookie, or the subdomain. So it is
-- stored here, server-side, and the client never carries it at all — it only
-- carries the Supabase auth session that identifies WHO is asking.
--
-- Keyed by identity rather than by browser session: one selection per person,
-- shared across their devices and tabs. That is a deliberate simplification
-- and it is the one thing to revisit if per-tab tenant switching is ever
-- wanted. Doing it per-session would need a server-side session store keyed on
-- something stable per browser, which Supabase's stateless JWT does not give
-- us without adding one.
--
-- A stored selection is never trusted on its own. Every read re-validates that
-- an ACTIVE membership still exists for the pair, so revoking a membership
-- takes effect on the next request rather than whenever the row is cleaned up.

CREATE TABLE "active_tenant_selections" (
    "identityId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "active_tenant_selections_pkey" PRIMARY KEY ("identityId")
);

CREATE INDEX "active_tenant_selections_tenantId_idx" ON "active_tenant_selections"("tenantId");

-- RESTRICT on identity: identities are never deleted.
-- CASCADE on tenant: if a tenant goes, a dangling selection pointing at it is
-- meaningless, and the membership it depended on went with it.
ALTER TABLE "active_tenant_selections" ADD CONSTRAINT "active_tenant_selections_identityId_fkey"
  FOREIGN KEY ("identityId") REFERENCES "identities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "active_tenant_selections" ADD CONSTRAINT "active_tenant_selections_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

GRANT SELECT, INSERT, UPDATE, DELETE ON "active_tenant_selections" TO app_user;

ALTER TABLE "active_tenant_selections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "active_tenant_selections" FORCE ROW LEVEL SECURITY;

-- Scoped to the IDENTITY, not the tenant. This row is read before any tenant
-- is known — it is what determines the tenant — so a tenant-scoped policy
-- would be circular and would always return nothing.
CREATE POLICY "active_tenant_selections_own" ON "active_tenant_selections"
  FOR SELECT USING ("identityId" = app.current_identity_id());

CREATE POLICY "active_tenant_selections_insert_own" ON "active_tenant_selections"
  FOR INSERT WITH CHECK ("identityId" = app.current_identity_id());

CREATE POLICY "active_tenant_selections_update_own" ON "active_tenant_selections"
  FOR UPDATE USING ("identityId" = app.current_identity_id())
          WITH CHECK ("identityId" = app.current_identity_id());

CREATE POLICY "active_tenant_selections_delete_own" ON "active_tenant_selections"
  FOR DELETE USING ("identityId" = app.current_identity_id());
