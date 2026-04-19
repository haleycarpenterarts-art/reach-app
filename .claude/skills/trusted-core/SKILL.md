---
name: trusted-core
description: Use whenever writing or modifying code that touches authentication, authorization, role/permission checks, money calculations (cost, sell, labor, tax, markup, margin, rollups), pricing, approvals, audit events, or snapshot/version records. Also use when adding any server-side mutation that affects financial values, access control, or issued artifacts. This is the highest-rigor zone — AI output never enters it without human acceptance.
---

# Trusted core

The trusted core is deterministic infrastructure every feature depends on. Changes here require full test coverage and extra review.

## Scope

- Authentication and session handling
- Authorization (role + attribute-based, server-side)
- Money calculation services
- Approval mechanics and state transitions
- Audit event emission
- Snapshot / revision framework
- Backup integrity

## Authorization

- Location: all authorization helpers live in `lib/authz/`.
- Every mutation and every protected read calls `lib/authz/check()` (or equivalent) before executing. No exceptions.
- Deny by default. If no explicit grant exists for (role, record, action), access is denied.
- UI hiding is never access control. It is UX only.
- Do not short-circuit with "this is an admin action so we skip the check." Admins also go through `authz`.
- Every authorization failure emits an audit event.

## Money calculations

- Location: all money and calculation services live in `lib/money/`.
- Currency values use a decimal type (e.g., `Prisma.Decimal`, `decimal.js`). Never JavaScript `number`.
- No ad-hoc arithmetic on money in components, routes, or services. Always call `lib/money/`.
- Formulas for cost, sell, labor, tax, markup, margin, and rollups are centralized. Do not duplicate them in UI or route code.
- Every money-changing action emits an audit event with before/after values.
- Unit tests cover: rounding boundaries, zero-quantity lines, mixed-currency rejections (if multi-currency is ever introduced), negative adjustments, and rollup correctness across nested levels (line → room → area → project).
- Regression tests exist for every money-changing bug fix.

## Snapshots and revisions

Issued commercial artifacts are frozen. They do not mutate when source data changes later.

- When an estimate, proposal, or BOM revision is issued:
  - Capture a full snapshot of line items, pricing, descriptions, and Library references *as they were at that moment*.
  - Mark the snapshot with: revision number, issued-at timestamp, issuing user, and parent draft.
- Later Library price changes flag as *variances against existing snapshots*. They do not retroactively edit them.
- A new revision is a new snapshot, not a mutation of the previous one.
- `Version Compare` always reads from snapshots, never from current draft state.

## Approval mechanics

- An approval is a structured record, not a boolean field on the parent.
- Approvals log: user, role, action approved, timestamp, decision (Go / Hold / Rework / Reject), optional rationale.
- Segregation of duties is enforced in code, not in policy alone. See `governance` skill for specific SoD rules.
- Approvals cannot be silently overridden. An admin override is itself a separate, auditable action.

## Audit events

- Location: audit emitters live in `lib/audit/`.
- Emit an event for every one of these:
  - Login success, login failure.
  - Authorization failure.
  - User creation, role change, permission grant/revoke.
  - Any money-changing action (create, update, approve estimate / BOM / invoice / PO).
  - Approval actions and state transitions.
  - Customer document generation and release.
  - Ingest acceptance (when extracted data is promoted to a real record).
  - Critical configuration changes.
  - Admin overrides.
- Audit records are append-only. Do not provide an edit or delete API surface for them.
- Never log secrets, full request bodies, or PII beyond what is necessary to identify the actor and target.

## Backup integrity

- Backups are automated and monitored at the provider level, but the application contributes by:
  - Keeping migrations reversible where possible.
  - Never deleting data as part of a migration without a documented, reviewed need.
  - Avoiding "soft-delete then purge" patterns that eliminate audit trails.

## Testing bar for this zone

- Unit tests for every money function.
- Permission tests for every protected route and mutation, exercised at each relevant role.
- Snapshot tests that prove issued revisions are immune to later source-data changes.
- Integration tests for full approval flows.
- Regression tests for every fixed defect in this zone.

## What triggers a stop

Halt and flag any of these for human review:

- AI-generated content about to be written into a money field, approval, or issued artifact.
- A code path that bypasses `lib/authz/`.
- A money calculation implemented outside `lib/money/`.
- A migration that deletes data.
- A change to audit-emitter logic that reduces what's logged.
