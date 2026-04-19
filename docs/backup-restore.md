# Backup & Restore

Phase 1 deliverable per PHASES.md: RPO 15–60 min, RTO 4–8 hours. This doc covers what's in place today, how to run manual backups, how to restore, and when to upgrade.

## What's in place

### 1. Automatic Supabase daily snapshots (free tier)

Supabase takes a **daily snapshot** of your Postgres database on all plans, including free. Retention is 7 days on free tier; longer on paid plans.

**Where to find them:** Supabase Dashboard → your project → **Database** → **Backups**.

From that page you can download a snapshot as a `.tar.gz` or restore into the same project.

### 2. On-demand `pg_dump` backup (local)

For belt-and-suspenders backups (e.g., before risky migrations, schema refactors, or manual data surgery), run:

```bash
npm run db:backup
```

Output: timestamped `.sql` file in `./backups/` (gitignored).

**Prerequisites:** `pg_dump` on your PATH.

- **macOS:** `brew install postgresql`
- **Windows:** install the "Command Line Tools" from the official Postgres installer at <https://www.postgresql.org/download/windows/> — you only need `pg_dump` and `psql`, not the server.
- **Linux:** `sudo apt install postgresql-client` (or distro equivalent)

The script uses `DIRECT_URL` from `.env.local` (Session Pooler, IPv4-safe).

## How to restore

### Scenario A — Restore into the same project (Supabase-managed rollback)

**Use when:** a recent migration broke something; you need to revert to yesterday's state.

1. Supabase Dashboard → **Database** → **Backups**
2. Pick the snapshot you want
3. Click **Restore**
4. Confirm

This overwrites the current database. Irreversible without another backup. Communicate downtime.

### Scenario B — Restore into a separate environment (the "proper" test)

**Use when:** proving the backup is valid; setting up staging; forensic review.

1. Create a second Supabase project (free tier is fine for a drill) — e.g., `reach-restore-test`.
2. Get its `DIRECT_URL` from the new project's Database settings.
3. Restore the dump:

   ```bash
   psql "<new DIRECT_URL>" < backups/reach-<timestamp>.sql
   ```

4. Run a smoke check:

   ```bash
   psql "<new DIRECT_URL>" -c "SELECT count(*) FROM profiles;"
   psql "<new DIRECT_URL>" -c "SELECT count(*) FROM audit_events;"
   ```

5. Delete the restore-test project once verified (keeps the bill at $0).

### Scenario C — Restore a single `pg_dump` file locally

```bash
# Assuming you have a local Postgres running at localhost:5432
createdb reach_restore
psql postgres://localhost:5432/reach_restore < backups/reach-<timestamp>.sql
```

## Recommended cadence

| Event | Action |
|---|---|
| Daily | Supabase automatic snapshot (nothing to do) |
| Before a risky schema change | `npm run db:backup` into `./backups/` |
| Before first real-user onboarding | Do Scenario B — full restore into a separate project, verify row counts, then tear down |
| Monthly | Do Scenario B as an exercise; log the result in an ops journal |
| After an incident | `npm run db:backup` before any remediation work |

## When to upgrade to Supabase Pro ($25/mo)

Upgrade when any of the following becomes true:

- **Real users onboarded.** Free-tier 7-day retention is thin for business data.
- **Need PITR** (Point-in-Time Recovery): sub-day granularity, recover from "that one query 3 hours ago."
- **Need long-term retention.** Pro extends backup retention and adds downloadable archives.

The budget decision (DECISIONS.md 2026-04-17 — $500/mo operating budget) already assumes Pro; the $25/mo is deferred until value justifies it.

## What's deliberately deferred

- **Automated off-site copy** (e.g., `pg_dump` on a cron to S3) — fine for later. Supabase + manual `db:backup` is sufficient for Phase 1.
- **Encrypted-at-rest backup archive** — Supabase handles this server-side.
- **Backup verification CI job** — nice-to-have; add when we have more than one developer or a real ops rhythm.

## Incident-response quick reference

If prod is broken and you suspect data loss or corruption:

1. **Do not panic-run migrations.** Take a manual `pg_dump` first: `npm run db:backup`.
2. Open the Supabase Backups page. Note the latest good snapshot time.
3. Decide: rollback (Scenario A) vs. selective restore (restore to a side project, extract specific rows, reinsert).
4. Announce downtime if rollback is needed — users get signed out and may lose recent changes.
5. Post-mortem: record the timeline, root cause, corrective action per PHASES.md §Incident response.
