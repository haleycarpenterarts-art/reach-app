---
name: production-ops
description: Use whenever working on backups, disaster recovery, monitoring, observability, CI pipelines, environment configuration, secrets management, database migrations, deployment infrastructure, incident response, or any feature that affects reliability, uptime, or recoverability. Also use when establishing or modifying the Day 2 operational routines.
---

# Production operations and Day 2

This application is the operating system of a business. Downtime and data loss are directly operational damage. Production discipline is not optional, even for an internal 10–20 user system. See `PHASES.md` "Day 2 operations" for the full spec.

## Environments

Three environments, always:

- **Local** — developer machines, never pointed at real data.
- **Staging** — mirrors production closely enough for realistic validation. Seeded with realistic scenarios (conference room retrofit, golf simulator build, residential theater install).
- **Production** — the live business system.

Never deploy directly to production from a local machine. All production changes go through CI.

## Secrets management

- Secrets live in a managed provider. Never in source control. Never in `.env` files committed to the repo.
- Different environments have different secrets. No sharing of production secrets into staging or local.
- Rotate secrets on schedule. Rotate immediately on any compromise signal or employee offboarding.
- Audit who has access to production secrets. Restrict to the smallest possible set.

## Database migrations

- Migrations are reviewed before production deployment.
- Destructive migrations (column drops, data deletions) require named approval and a rollback plan.
- Staging runs the migration first, against production-like data volume where feasible.
- Migrations are idempotent where possible.
- Every migration is logged with who deployed and when.

## Backups and disaster recovery

### Targets

| Metric | Target | Reason |
|--------|--------|--------|
| RPO | 15–60 minutes | Limits business data loss in a central operations system |
| RTO | 4–8 hours | Reasonable for internal business continuity at this scale |
| Restore testing | Monthly | Backup validity must be verified, not assumed |

### Strategy

- Managed PostgreSQL with automated snapshots.
- Continuous WAL archiving for point-in-time recovery capability.
- Off-site backup retention.
- Backup integrity verification.
- Monthly restore-test into a separate environment.
- Written disaster recovery runbook with named owner and recovery steps.

A backup that hasn't been successfully restored is not a backup. It's a hope.

## Monitoring and observability

Minimum required signals:

- App uptime and health checks.
- API error rate tracking.
- Background job failures.
- Slow database query visibility.
- Export / generation failure metrics.
- Ingest queue monitoring.
- Authentication failure monitoring.

Alerts are routed to the technical owner. Quiet alerts (low-severity trends) go to a channel; noisy alerts (production-impacting) page directly.

## Structured logging

- Logs are structured (JSON), not raw text.
- Logs are searchable and access-restricted.
- Logs are retained according to a written policy (open decision — see `DECISIONS.md`).
- Never log: secrets, full request bodies with PII, sensitive fields (see `governance` skill).
- Log at minimum: request ID, user ID (if authenticated), action, target resource, outcome.

## CI pipeline

- Every PR runs: typecheck, lint, unit tests, integration tests.
- Merging to main triggers a staging deployment.
- Production deployment is a separate, gated step — not automatic from main.
- Migration steps are included in deployment with review.

## Change control

| Class | Scope | Requirements |
|-------|-------|--------------|
| Low risk | Layout changes, non-critical UX | Standard review |
| Medium risk | Workflow changes, new reports, additional statuses, import adjustments | Integration tests |
| High risk | Pricing logic, approval rules, permission changes, migration-heavy releases, backup configuration, customer document release logic | Staging verification + test evidence + rollback plan + named approval |

Any change to anything in the `trusted-core` skill's scope is, by default, high risk.

## Day 2 routines

**Weekly:**
- Review production errors and failed jobs.
- Review critical audit events.
- Confirm backup jobs succeeded.
- Triage user-reported issues.
- Review pending releases or hotfixes.

**Monthly:**
- Restore-test backups into a separate environment.
- Review access and permission appropriateness.
- Review workflow friction and failed gates.
- Review money-logic anomalies.
- Review customer communication quality and usage.

**Quarterly:**
- Security review of users, roles, secrets, dependencies.
- Disaster recovery rehearsal.
- Module roadmap review.
- Data retention and archival review.
- Process simplification review based on operational evidence.

## Incident response

### Classes

- Service outage.
- Failed deployment.
- Broken money calculation or estimate total.
- Data corruption or accidental deletion.
- Permission / security incident.
- Failed backup or failed restore test.

### Each incident produces

- Time detected.
- Impact summary.
- Immediate containment steps.
- Owner assigned.
- Root cause.
- Corrective action.
- Preventive improvement item.

Incident records are kept. Patterns inform continuous improvement.

## Continuous improvement loop

1. Capture friction (users, failed gates, incidents, customer-impacting misses).
2. Classify: bug · training · data · workflow · feature gap.
3. Route to the right backlog lane.
4. Prioritize by operational value, not noise volume.
5. Release in controlled batches.

Improvement destinations:

- Library quality improvements.
- Gate and approval rule refinements.
- UI simplification opportunities.
- Playbook updates.
- Customer communication template improvements.

Cadence: monthly or quarterly for most operational refinement. Urgent issues handled immediately when they affect customer outcomes, financial risk, or repeated execution failures.

## Developer handoff package

When the app is ready for long-term maintenance, the handoff package includes:

- Architecture overview.
- Service / module map.
- Database schema and migration history.
- RBAC matrix.
- Audit event catalog.
- Backup and recovery procedures.
- Deployment instructions.
- Environment variable reference.
- Test suite instructions.
- Known risks and deferred items list.

Treat the handoff package as part of the product. Keep it current.

## What not to build

- A backup strategy that has never been restore-tested.
- Production deployments triggered automatically on merge to main. Production is a gated step.
- Secrets in `.env.example` with real values, even commented-out.
- Logging that captures full request bodies, including sensitive fields.
- A monitoring surface with no one assigned to respond to alerts.
- "Soft-delete then purge" patterns that eliminate audit trails as a side effect.
