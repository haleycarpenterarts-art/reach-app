# PHASES.md — Build plan

This is the production build plan. Features are grouped into phases; each phase has explicit entry and exit criteria. Do not start a phase until the previous phase's exit criteria are met.

The phase structure follows the confidence-zone model from `CLAUDE.md`: foundation → trusted core → operational workflows → revenue modules → adaptive intelligence.

---

## Phase 1 — Foundation and guardrails

*Goal: a secure, deployable skeleton before any feature code.*

### Deliverables

- Repository structure and coding standards (align with `CLAUDE.md`).
- Environment separation: local, staging, production.
- Secrets management approach (managed, never in source control).
- RBAC model and permission matrix skeleton (see `.claude/skills/governance/`).
- Audit event design (shape of the audit record, which actions emit).
- Backup and recovery objectives: RPO 15–60 min, RTO 4–8 hours.
- Error logging and monitoring baseline.
- CI pipeline with automated tests and migration controls.
- A minimal happy-path deployment to staging.

### Exit criteria

- Three environments deploy from CI.
- Secrets are managed and never committed.
- Database migrations run from CI with review gates for production.
- A test user can sign in, hit a protected route, and produce an audit log entry.
- A backup has been taken and successfully restored into a separate environment.

---

## Phase 2 — Trusted core

*Goal: the subsystems every feature will depend on.*

### Deliverables

- Authentication and user management (managed provider).
- Role model with least-privilege defaults.
- Server-side authorization on every protected resource (`lib/authz/`).
- Audit logging for all high-value actions (`lib/audit/`).
- Shared status model (`Draft / Ready / Approved / In progress / On hold / Complete`) and transition control framework.
- Centralized money calculation services (`lib/money/`) using a decimal type. No floating-point currency anywhere.
- Snapshot / version framework for estimates and approvals.

### Exit criteria

- Every route is either explicitly public or goes through `lib/authz/`.
- Money logic has automated tests covering cost, sell, labor, tax, markup, margin, and rollup — including edge cases for rounding and zero-quantity lines.
- Audit events for authentication, authorization failures, approvals, state transitions, money-changing actions, and permission changes are all emitted and queryable.
- Snapshot mechanism verified: issuing a version captures pricing and content at that moment; later Library changes do not mutate issued snapshots.

---

## Phase 3 — Core operating workflows

*Goal: make the platform operationally useful.*

### Deliverables

- Accounts (Companies), Contacts, Sites/Locations, Vendors.
- Project Card with required sections (see `SPEC.md` §5).
- Notes and activity timeline.
- Files and documents.
- Universal task object reused across modules.
- Role-tailored Project Card views for at least PM and Technician.
- Library (master data, basic commercial fields; full technical schema deferred to Phase 4 where needed).

### Exit criteria

- The Project Card functions as the operational center: every note, file, task, and decision attaches to a Project Card.
- A Technician on mobile sees only today's assigned work, site info, room notes, and can log progress and photos. No cost/margin visible.
- A PM sees schedule, tasks, changes, purchasing status, and required approvals.
- Permission tests pass for both views.

---

## Phase 4 — Revenue and execution modules

*Goal: the modules that produce billable outputs.*

### Deliverables

- Estimation sub-application (see `SPEC.md` §12.1 and `.claude/skills/estimation/`).
- Library-driven BOM workflows.
- Schematic v1 (see `SPEC.md` §12.2 and `.claude/skills/schematic/`).
- Customer update generation (see `SPEC.md` §11 and `.claude/skills/customer-comms/`).
- Milestone-driven handoff controls.
- Gate enforcement for at least: Estimate ready → Proposal issue → Award → Deposit invoice sent → Purchasing release.

### Exit criteria

- Seeded end-to-end scenarios run cleanly: conference room retrofit, golf simulator build, residential theater install.
- Issued proposals carry snapshot pricing. Later Library price changes flag on subsequent revisions but do not alter issued ones.
- The hard rule is enforced: equipment cannot be ordered until a deposit invoice has been sent.
- Customer updates draw only from approved/visible fields — margin, internal notes, and vendor pricing are verifiably excluded.

### Intentional v1 scope limits

- Estimation, BOM, and Schematic stay useful, linked, and reliable — not a full ERP, CAD suite, or accounting platform.
- Schematic v1 covers concept and signal flow modes; rack connectivity and submittal modes may be staged in later.

---

## Phase 5 — Assisted intelligence and ingestion

*Goal: adaptive tooling layered on top of stable records.*

### Deliverables

- Ingest pipeline for emails, PDFs, Word, images, spreadsheets (see `SPEC.md` §13 and `.claude/skills/ingest/`).
- Task / decision / change extraction from meetings, notes, email threads.
- AI-assisted estimation behaviors: scope-to-structure, missing-scope detection, proposal language drafting.
- Schematic AI behaviors: first-pass signal flow, auto-place, connection recommendations.
- Embedded digital assistant with the guardrails in `SPEC.md` §14.4.

### Exit criteria

- No AI-generated content enters trusted-core paths (money, approvals, customer-facing outputs) without explicit human acceptance.
- All AI outputs are traceable to their source (meeting ID, document, prompt).
- The "this suggestion is wrong" feedback path is wired.

---

## Staged rollout (after Phase 5)

1. Staging environment with seeded data.
2. Admin and leadership review.
3. Small pilot group with low-risk workflows.
4. Controlled expansion to estimation and customer updates.
5. Full team rollout after stability and process corrections.
6. Progressive release of advanced modules.

---

## Deployment readiness checklist

Before full deployment:

- [ ] RBAC is enforced server-side and tested.
- [ ] Secrets are managed securely and not exposed in code or logs.
- [ ] Audit logs exist for critical actions and are access-restricted.
- [ ] Automated backups are running and have been restore-tested.
- [ ] Money logic has automated tests and snapshot behavior verified.
- [ ] Staging mirrors production closely enough for realistic validation.
- [ ] Incident runbooks are written and owners assigned.
- [ ] Monitoring and alerting exist for app health and key job failures.
- [ ] High-risk changes have a controlled deployment review process.
- [ ] Developer handoff package is complete and current (see below).

---

## Developer handoff package

Treat this as part of the product. When the v1 is ready for long-term maintenance:

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

---

## Day 2 operations

### Ownership

| Area | Owner | Responsibility |
|------|-------|----------------|
| Product / process | Internal business lead | Workflow priorities, process fit, simplification decisions |
| Technical | Lead developer | Architecture, deployments, reliability, defects, roadmap |
| Security / data | Admin or technical owner | Access reviews, audit review, backup verification, incident coordination |
| Module owners | Department leads | Library quality, estimate standards, customer update quality, operational feedback |

### Routines

**Weekly:** review production errors and failed jobs · review critical audit events · confirm backup jobs succeeded · triage user-reported issues · review pending releases or hotfixes.

**Monthly:** restore-test backups · review access and permission appropriateness · review workflow friction and failed gates · review money-logic anomalies · review customer communication quality.

**Quarterly:** security review of users, roles, secrets, dependencies · disaster recovery rehearsal · module roadmap review · data retention and archival review · process simplification review based on operational evidence.

### Incident response

**Classes:** service outage · failed deployment · broken money calculation or estimate total · data corruption or accidental deletion · permission / security incident · failed backup or failed restore test.

**Each incident produces:** time detected · impact summary · immediate containment · owner assigned · root cause · corrective action · preventive improvement item.

### Change control

| Class | Scope | Requirements |
|-------|-------|--------------|
| Low risk | Layout changes, non-critical UX improvements | Standard review |
| Medium risk | Workflow changes, new reports, additional statuses, import adjustments | Integration tests |
| High risk | Pricing logic, approval rules, permission changes, migration-heavy releases, backup configuration, customer document release logic | Staging verification + test evidence + rollback plan + named approval |

### Observability

- App uptime and health checks.
- API error rate tracking.
- Background job failures.
- Slow database query visibility.
- Export / generation failure metrics.
- Ingest queue monitoring.
- Authentication failure monitoring.

### Continuous improvement

1. Capture friction (users, failed gates, incidents, customer-impacting misses).
2. Classify: bug · training · data · workflow · feature gap.
3. Route to the right backlog lane.
4. Prioritize by operational value, not noise volume.
5. Release in controlled batches.
