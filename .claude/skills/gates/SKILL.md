---
name: gates
description: Use whenever implementing stage transitions, workflow gates, approval flows, Go/Hold/Rework/Reject decisions, required-field validation for stage advancement, billable-action gating, or any check that blocks or permits advancement through the project lifecycle. Also use when wiring gate triggers (creating downstream records on successful transition).
---

# Gates, triggers, and stage transitions

A gate is a controlled transition that validates required fields, files, approvals, and readiness conditions before allowing a Project Card or sub-process to advance. A stage does not advance simply because a user flips a status. See `SPEC.md` §9 for the full spec.

## Core rule

Status changes on controlled records go through the gate engine, not direct writes. A user cannot move a card from `Ready` to `Approved` by updating a field; they submit the transition, and the gate engine validates.

## Gate definition shape

Each gate declares:

- Entry stage
- Target stage
- Required fields (on the parent record or linked records)
- Required files / artifacts
- Required approvals (by role, possibly with thresholds)
- Blocking exceptions (conditions that prevent advancement even if everything else is present)
- Automatic triggers (records created, notifications sent on success)
- Decision outcomes: `Go` (advance), `Hold` (stay, blocked reason), `Rework` (return to earlier stage with notes), `Reject` (terminate/archive with reason)

## Gate classes

Implement these as named gate definitions:

- Lead qualification
- Discovery complete
- Estimate ready
- Proposal issue
- Award / contract
- Deposit received / Deposit invoice sent
- Purchasing release
- Install readiness
- Commissioning readiness
- Substantial completion
- Closeout
- Warranty / service handoff

Specific required fields / files / approvals per gate are **open decisions** (see `DECISIONS.md`). Stub them as configurable rather than hardcoding.

## Billable-action gating (hard rules)

These are enforced in the data access layer, not just the gate engine:

- **Equipment cannot be ordered until a deposit invoice has been sent.** This is the signature rule of this system. Enforce it in the PO creation path with a direct check, not merely via a gate definition.
- Vendor payment cannot be approved until invoice review and matching requirements are complete.
- Certain design revisions cannot be released as billable work until a change or approval record exists.
- Purchasing release may require an approved BOM revision and commercial authorization.

## Procurement and payment controls

Support standard procure-to-pay patterns:

- Purchase request / release authorization.
- PO approval routing by amount, category, or project.
- Goods receipt logging.
- Invoice intake and coding.
- Matching logic: PO ↔ receipt ↔ invoice.
- Payment approval separate from ordering authority (see `governance` skill — SoD).

## Trigger behaviors (examples)

When a gate transitions successfully:

- Proposal issued → create approval tracking and follow-up tasks.
- Project awarded → create PM handoff checklist and kickoff tasks.
- Deposit invoice sent → unblock the purchasing release workflow.
- BOM revision approved → enable PO creation against that specific revision.
- Install readiness passed → release technician scheduling and field task packages.
- Closeout passed → launch training, service, and warranty records.

Triggers are declarative in the gate definition, not scattered across the codebase.

## Failed gates

On failure:

- Present a readable list of missing fields, files, records, or approvals. Not "Gate failed." Not a stack trace.
- Allow the user to move the item into `Hold` or `Rework` with a visible reason.
- Never silently block. If a button is disabled, the reason is visible next to it.
- Log the failed attempt as an audit event (who, when, which gate, what was missing).

## Approval matrix

The matrix defines who approves what by transaction type, project phase, and monetary threshold. Structurally:

- PM approval up to a defined purchasing ceiling.
- Executive approval above ceiling or for margin exceptions.
- Finance approval for invoice release and payment authorization.
- Design lead approval for engineering package issue.
- Customer approval record required for certain scope or commercial changes.

Thresholds are **open decisions** (`DECISIONS.md`). Make them configuration-driven, not hardcoded.

## Implementation pattern

- Gate definitions live in a registry (code or configuration, depending on how dynamic they need to be).
- `GateEngine.attemptTransition(record, targetStage, user)` is the single entry point.
- The engine:
  1. Loads the gate definition for (entry stage → target stage).
  2. Checks `authz` first: does this user have Approve rights on this gate?
  3. Validates required fields, files, and linked records.
  4. Checks required approvals exist (or records a new approval if the current user is the approver).
  5. Runs blocking exceptions.
  6. On success: updates the record's stage, emits audit event, runs triggers.
  7. On failure: returns a structured list of blockers. Does not mutate state.

## What not to build

- Status changes that bypass the gate engine.
- Triggers that fire on write hooks rather than declared gate outcomes (ordering and debugging suffer).
- "Admin override" buttons that skip validation without logging. Overrides are themselves auditable gate outcomes.
- Hardcoded approval thresholds in service code.
