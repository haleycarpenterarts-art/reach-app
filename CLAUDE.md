# CLAUDE.md

Internal business operating system for an AV integrator. Serves ~10–20 users across a $5–10M/yr business. Covers the full project lifecycle: lead → estimate → design → handoff → purchasing → field execution → commissioning → closeout → training → service.

This is a real production system for internal use. Build it with production discipline, not prototype discipline. See `SPEC.md` for the functional truth and `PHASES.md` for the build plan.

## Stack

- **Frontend:** Next.js (App Router) + TypeScript
- **Backend:** Next.js API routes / server actions, with a clearly separated service layer (see "Architectural rules")
- **Database:** PostgreSQL (managed)
- **ORM:** Prisma
- **Auth:** managed provider with RBAC + MFA support — *provider not yet chosen, see `DECISIONS.md`*
- **File storage:** managed object storage — *provider not yet chosen, see `DECISIONS.md`*
- **Background jobs:** queue/worker for ingest, exports, notifications, report generation — *system not yet chosen, see `DECISIONS.md`*
- **Monitoring:** app monitoring, uptime checks, centralized error tracking, structured logs — *provider not yet chosen, see `DECISIONS.md`*

## Commands

*Commands will be filled in as the repo is scaffolded. When you add or change a command, update this section.*

- Dev server: `TBD`
- Build: `TBD`
- Test (unit): `TBD`
- Test (integration): `TBD`
- Lint: `TBD`
- Typecheck: `TBD`
- DB migrate (dev): `TBD`
- DB migrate (deploy): `TBD`
- DB seed: `TBD`

## Repository layout

*Fill in as scaffolded. Suggested shape:*

- `app/` — Next.js routes and server actions (presentation only; no business logic, no direct DB access)
- `components/` — UI components (presentation only)
- `services/` — business logic (pure, framework-agnostic where possible)
- `db/` — Prisma schema, migrations, repository functions (only layer that imports `@prisma/client`)
- `lib/money/` — centralized money and calculation services (see Trusted Core rules)
- `lib/audit/` — audit event emitters
- `lib/authz/` — authorization helpers
- `lib/ingest/` — AI extraction and suggestion pipeline
- `jobs/` — background workers
- `tests/` — unit, integration, permission, workflow tests
- `docs/` — architecture decision records and supplementary docs
- `.claude/skills/` — on-demand skills (see "Skills" below)

## Architectural rules (hard)

These are enforced across the whole codebase. Flag any violation rather than rationalizing around it.

1. **Layer separation is strict.**
   - Presentation layer (`app/`, `components/`) does not import from `db/` or call the ORM directly.
   - Service layer (`services/`) does not import UI/Next.js.
   - Data access layer (`db/`) is the only place `@prisma/client` is imported.
   - Integrations (auth, storage, queues, email, AI) are isolated behind adapters in `lib/` so the rest of the system does not depend on vendor SDKs.

2. **Project Card is the operational center.** Every billable action, every execution record, every project artifact attaches to a Project Card. Do not create standalone unscoped records for things that belong to a project.

3. **Library is the master data source.** Products, SKUs, pricing, standards, and room templates live in the Library. Projects *consume from* the Library; they do not duplicate master data inside themselves.

4. **Authorization is deny-by-default and server-side.** Every mutation and every protected read runs through `lib/authz/`. Never rely on UI to hide actions as the access control. Client-side checks are UX only.

5. **Money logic is centralized.** All cost, sell, labor, tax, markup, margin, and rollup calculations go through `lib/money/`. No ad-hoc arithmetic in components or routes. Currency uses a decimal type — never JavaScript `number` for money.

6. **Approved commercial records are snapshots, not live objects.** Issued estimates, proposals, and BOM revisions are frozen with their pricing at issue time. Later Library price changes do not retroactively mutate them.

7. **Deletion is archival.** Most records archive, void, supersede, or version. Hard deletion is reserved for truly exceptional cases and always audit-logged.

8. **Audit log is not optional.** Authentication events, authorization failures, approvals, state transitions, money-changing actions, permission changes, and customer document releases all emit audit events via `lib/audit/`.

9. **AI output is a suggestion until a user accepts it.** Extraction, auto-classification, diagram generation, and scope drafting produce *proposed* records. They do not become authoritative until a user with appropriate rights confirms them.

## Confidence zones

Every feature sits in one of three zones. The zone determines the rigor required.

| Zone | Scope | Standard |
|------|-------|----------|
| **Trusted core** | Auth, permissions, money logic, approvals, audit, snapshots, backups | Full testing. Changes require review. Deterministic behavior only. |
| **Operational workflows** | Project Card, Library, tasks, statuses, notes, docs, customer updates | Integration + permission tests. Role-tested. |
| **Adaptive tooling** | Ingest extraction, AI suggestions, schematic assistance, assistant | Human review required before anything critical is accepted. |

If you are about to put AI-generated content into a trusted-core path without human review, stop.

## Simplification principles (product rules)

These shape every workflow:

- **Default path / common exception / rare escalation.** Design each workflow around the happy path first, surface the common exception when it happens, reserve escalation for high-impact events.
- **One status model.** Reuse `Draft / Ready / Approved / In progress / On hold / Complete` across tasks, approvals, stages, and records unless a module truly requires specialized states.
- **One universal task object** reused across modules.
- **Minimum required input.** Every gate and every form asks for only what is actually needed to advance. Everything else is inferred, defaulted, extracted, or deferred.
- **Role-tailored views, not disabled fields.** Different roles see different layouts of the same record — hide irrelevant sections rather than greying them out.
- **Formalize only what changes execution.** A note stays a note until it affects scope, cost, schedule, commitment, ownership, or execution — then it becomes a structured decision, change, task, or approval.

## Workflow rules for building this app

- **Plan before code.** Use Plan Mode (Shift+Tab twice) for any feature that touches more than one file. Confirm the plan before execution.
- **Commit after each meaningful step** with a descriptive message. Rollback must always be an option.
- **Run typecheck, lint, and tests before claiming a task is done.** Do not report completion on code that does not compile.
- **Prefer editing the skill to embedding context in a prompt.** If you find yourself re-explaining a rule across sessions, that rule belongs in `CLAUDE.md` or the relevant skill.
- **Ask before inventing stack decisions.** Anything marked TBD in this file or in `DECISIONS.md` is not for you to pick silently — surface it.

## Skills

The following skills live under `.claude/skills/` and load on demand. Invoke the relevant one before working in its area:

- `trusted-core` — auth, permissions, money, approvals, audit, snapshots
- `project-card` — card structure, sections, role-specific views
- `library` — master data, pricing, standards, product lookup
- `governance` — RBAC/ABAC, roles, SoD, sensitive fields, project assignment
- `gates` — stage transitions, approval flows, required fields/files/approvals
- `estimation` — BOM tables, revision logic, proposal and scope generation
- `schematic` — diagram generation, signal flow, device validation
- `ingest` — document/email/meeting extraction, suggestion review
- `customer-comms` — customer section, touchpoints, update generation
- `production-ops` — backups, monitoring, CI, migrations, incidents

## Data governance rules (always apply)

- Project Card is the source of truth for active project state.
- Library is the source of truth for item metadata and pricing standards.
- Issued estimates, proposals, and BOM revisions are snapshot records, not editable live objects.
- AI-extracted values are suggestions until user-accepted.
- Customer-facing outputs draw only from approved/visible fields — no internal notes, margin, or vendor pricing.

## When something is unclear

Check, in order: `SPEC.md` → the relevant skill → `DECISIONS.md` → ask the user. Do not invent answers for open decisions.
