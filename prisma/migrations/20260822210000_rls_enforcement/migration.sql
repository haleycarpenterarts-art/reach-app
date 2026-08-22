-- RLS enforcement — step 3 of docs/tenancy-model.md
--
-- The previous migration created policies that did not bite: Prisma connects
-- as `postgres`, which carries rolbypassrls, so every policy was decorative.
-- This migration makes them real.
--
-- APPROACH: a NOLOGIN role the app switches into per transaction, rather than
-- a second set of connection credentials. `SET LOCAL ROLE app_user` inside the
-- transaction changes the effective role for the duration; app_user has
-- NOBYPASSRLS, so policies apply. Transaction-local, so a pooled connection
-- returns to its normal role on commit or rollback.
--
-- Why not a second login role: it would mean a password in .env.local and in
-- every deploy environment, a second connection string through the pooler, and
-- a credential to rotate. SET ROLE achieves the same isolation with none of
-- that, and the privilege boundary is identical — app_user cannot bypass RLS
-- however it is reached.

-- ---------------------------------------------------------------
-- The unprivileged application role
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOLOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
  ELSE
    -- Never let it drift into something that can bypass what it is for.
    ALTER ROLE app_user NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;

-- The connecting role must be a member of app_user to SET ROLE into it.
GRANT app_user TO CURRENT_USER;

GRANT USAGE ON SCHEMA public TO app_user;
GRANT USAGE ON SCHEMA app TO app_user;
GRANT EXECUTE ON FUNCTION app.current_tenant_id() TO app_user;
GRANT EXECUTE ON FUNCTION app.current_identity_id() TO app_user;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  "tenants", "tenant_trades", "identities", "memberships", "roles", "audit_events"
TO app_user;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Future tables inherit the same table privileges. RLS still governs the rows,
-- and a table without a policy therefore returns nothing to app_user — which
-- is the correct failure direction for a table someone forgot to police.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- ---------------------------------------------------------------
-- FORCE: subject the table owner to its own policies too.
--
-- A role holding the BYPASSRLS attribute still bypasses, so this does not
-- change how `postgres` behaves today. It is here so that isolation does not
-- silently depend on who happens to own the table later.
-- ---------------------------------------------------------------
ALTER TABLE "tenants" FORCE ROW LEVEL SECURITY;
ALTER TABLE "tenant_trades" FORCE ROW LEVEL SECURITY;
ALTER TABLE "identities" FORCE ROW LEVEL SECURITY;
ALTER TABLE "memberships" FORCE ROW LEVEL SECURITY;
ALTER TABLE "roles" FORCE ROW LEVEL SECURITY;
ALTER TABLE "audit_events" FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- Write policies
--
-- The previous migration created SELECT policies only, which is deny-by-default
-- for writes. Two writes have to work for the application to function at all,
-- and both are narrow.
--
-- Everything else — provisioning a tenant, enabling a trade, seeding roles,
-- inviting a member — stays privileged and has no app_user policy. Those are
-- administrative operations, and they will get their own policies when the
-- admin surface is built, not before.
-- ---------------------------------------------------------------

-- Self-provisioning on first authenticated request. An identity may create and
-- amend its own row and no other.
CREATE POLICY "identities_insert_self" ON "identities"
  FOR INSERT WITH CHECK ("id" = app.current_identity_id());

CREATE POLICY "identities_update_self" ON "identities"
  FOR UPDATE USING ("id" = app.current_identity_id())
          WITH CHECK ("id" = app.current_identity_id());

-- Audit writes are never blocked. A policy that can refuse an audit insert is
-- a policy that can silence the log, and CLAUDE.md rule 8 says the log is not
-- optional. The table is append-only by trigger, so a row written here cannot
-- later be altered or removed by anyone.
CREATE POLICY "audit_events_insert" ON "audit_events"
  FOR INSERT WITH CHECK (true);
